import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

type CreateStudentBody = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  studentId?: string;
  admissionNumber?: string;
  classId?: string;
  admissionDate?: string | null;
  dateOfBirth?: string | null;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  state?: string;
  lga?: string;
};

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function createTemporaryPassword(surname: string): string {
  /*
   * The student's surname is the temporary password.
   *
   * Examples:
   * " Abdulrahman " -> "abdulrahman"
   * " Faya "        -> "faya"
   * " Wahid "       -> "wahid"
   *
   * All whitespace is removed so accidental spaces
   * can never become part of the password.
   */
  return surname.replace(/\s+/g, "").toLowerCase();
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

export async function POST(request: Request) {
  let authUserId: string | null = null;
  let profileCreated = false;
  let studentCreated = false;

  try {
    /*
     * ---------------------------------------------------------
     * 1. Validate environment variables
     * ---------------------------------------------------------
     */

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !supabasePublishableKey ||
      !serviceRoleKey
    ) {
      console.error(
        "Missing required Supabase environment variables.",
        {
          hasUrl: Boolean(supabaseUrl),
          hasPublishableKey: Boolean(supabasePublishableKey),
          hasServiceRoleKey: Boolean(serviceRoleKey),
        }
      );

      return errorResponse(
        "Server configuration is incomplete.",
        500
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. Create authenticated server client
     * ---------------------------------------------------------
     */

    const cookieStore = await cookies();

    const supabase = createServerClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(
                ({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                }
              );
            } catch {
              // Cookie writes may be unavailable in some contexts.
            }
          },
        },
      }
    );

    /*
     * ---------------------------------------------------------
     * 3. Get currently authenticated user
     * ---------------------------------------------------------
     */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse(
        "You must be signed in to perform this action.",
        401
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Verify admin/developer role
     * ---------------------------------------------------------
     */

    const {
      data: currentProfile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, role, first_name, last_name, email"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Unable to verify admin profile:",
        profileError
      );

      return errorResponse(
        "Unable to verify your administration privileges.",
        500
      );
    }

    if (
      !currentProfile ||
      !["admin", "developer"].includes(
        currentProfile.role
      )
    ) {
      return errorResponse(
        "You are not authorized to create students.",
        403
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. Parse request body
     * ---------------------------------------------------------
     */

    let body: CreateStudentBody;

    try {
      body = await request.json();
    } catch {
      return errorResponse(
        "Invalid request body."
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. Normalize incoming data
     * ---------------------------------------------------------
     */

    const firstName = normalizeText(
      body.firstName
    );

    const middleName = normalizeText(
      body.middleName
    );

    const lastName = normalizeText(
      body.lastName
    );

    const email = normalizeEmail(
      body.email
    );

    const phone = normalizeText(
      body.phone
    );

    const studentId = normalizeText(
      body.studentId
    );

    const admissionNumber = normalizeText(
      body.admissionNumber
    );

    const classId = normalizeText(
      body.classId
    );

    const admissionDate =
      typeof body.admissionDate === "string" &&
      body.admissionDate.trim()
        ? body.admissionDate.trim()
        : null;

    const dateOfBirth =
      typeof body.dateOfBirth === "string" &&
      body.dateOfBirth.trim()
        ? body.dateOfBirth.trim()
        : null;

    const guardianName = normalizeText(
      body.guardianName
    );

    const guardianPhone = normalizeText(
      body.guardianPhone
    );

    const address = normalizeText(
      body.address
    );

    const state = normalizeText(
      body.state
    );

    const lga = normalizeText(
      body.lga
    );

    /*
     * ---------------------------------------------------------
     * 7. Basic validation
     * ---------------------------------------------------------
     */

    if (!firstName) {
      return errorResponse(
        "First name is required."
      );
    }

    if (!lastName) {
      return errorResponse(
        "Surname is required."
      );
    }

    if (!studentId) {
      return errorResponse(
        "Student ID is required."
      );
    }

    if (!classId) {
      return errorResponse(
        "Please select a class."
      );
    }

    if (!email) {
      return errorResponse(
        "Email is required."
      );
    }

    /*
     * ---------------------------------------------------------
     * 8. Create temporary password
     * ---------------------------------------------------------
     *
     * The surname itself is the temporary password.
     *
     * Examples:
     *
     * " Abdulrahman " -> "abdulrahman"
     * " Faya "        -> "faya"
     * " Wahid "       -> "wahid"
     * " Ali "         -> "ali"
     *
     * There is intentionally NO artificial minimum-length
     * check here.
     */

    const temporaryPassword =
      createTemporaryPassword(lastName);

    if (!temporaryPassword) {
      return errorResponse(
        "Unable to create the temporary password from the surname."
      );
    }

    /*
     * ---------------------------------------------------------
     * 9. Create Supabase service-role client
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * This client exists ONLY on the server.
     *
     * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
     */

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    /*
     * ---------------------------------------------------------
     * 10. Validate class
     * ---------------------------------------------------------
     */

    const {
      data: classRow,
      error: classError,
    } = await supabaseAdmin
      .from("classes")
      .select("id, name")
      .eq("id", classId)
      .maybeSingle();

    if (classError) {
      console.error(
        "Class validation error:",
        classError
      );

      return errorResponse(
        "Unable to validate the selected class.",
        500
      );
    }

    if (!classRow) {
      return errorResponse(
        "The selected class does not exist."
      );
    }

    /*
     * ---------------------------------------------------------
     * 11. Check duplicate Student ID
     * ---------------------------------------------------------
     */

    const {
      data: existingStudentId,
      error: studentIdError,
    } = await supabaseAdmin
      .from("students")
      .select("id, student_id")
      .eq("student_id", studentId)
      .maybeSingle();

    if (studentIdError) {
      console.error(
        "Student ID duplicate check failed:",
        studentIdError
      );

      return errorResponse(
        "Unable to verify the Student ID.",
        500
      );
    }

    if (existingStudentId) {
      return errorResponse(
        `Student ID "${studentId}" is already in use.`,
        409
      );
    }

    /*
     * ---------------------------------------------------------
     * 12. Check duplicate admission number
     * ---------------------------------------------------------
     */

    if (admissionNumber) {
      const {
        data: existingAdmissionNumber,
        error: admissionError,
      } = await supabaseAdmin
        .from("students")
        .select("id, admission_number")
        .eq(
          "admission_number",
          admissionNumber
        )
        .maybeSingle();

      if (admissionError) {
        console.error(
          "Admission number duplicate check failed:",
          admissionError
        );

        return errorResponse(
          "Unable to verify the admission number.",
          500
        );
      }

      if (existingAdmissionNumber) {
        return errorResponse(
          `Admission number "${admissionNumber}" is already in use.`,
          409
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 13. Check existing profile email
     * ---------------------------------------------------------
     */

    const {
      data: existingProfile,
      error: existingProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingProfileError) {
      console.error(
        "Profile email check failed:",
        existingProfileError
      );

      return errorResponse(
        "Unable to verify the student's email.",
        500
      );
    }

    if (existingProfile) {
      return errorResponse(
        "An account with this email address already exists.",
        409
      );
    }

    /*
     * ---------------------------------------------------------
     * 14. Find current academic session
     * ---------------------------------------------------------
     */

    const {
      data: currentSession,
      error: sessionError,
    } = await supabaseAdmin
      .from("academic_sessions")
      .select("id, name")
      .eq("is_current", true)
      .maybeSingle();

    if (sessionError) {
      console.error(
        "Current session lookup failed:",
        sessionError
      );

      return errorResponse(
        "Unable to determine the current academic session.",
        500
      );
    }

    if (!currentSession) {
      return errorResponse(
        "No current academic session has been configured."
      );
    }

    /*
     * ---------------------------------------------------------
     * 15. Create Supabase Auth account
     * ---------------------------------------------------------
     */

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,

        user_metadata: {
          first_name: firstName,
          middle_name: middleName || null,
          last_name: lastName,
          role: "student",
          student_id: studentId,
        },
      });

    if (authError) {
      console.error(
        "Auth user creation failed:",
        authError
      );

      const authMessage =
        authError.message.toLowerCase();

      if (
        authMessage.includes("already") ||
        authMessage.includes("exists") ||
        authMessage.includes("duplicate")
      ) {
        return errorResponse(
          "An account with this email address already exists.",
          409
        );
      }

      /*
       * Return the actual Supabase password-policy message
       * so we know if the project's Auth configuration
       * rejects a short surname.
       */
      return errorResponse(
        authError.message ||
          "Unable to create the student's login account.",
        400
      );
    }

    if (!authData.user) {
      return errorResponse(
        "Student login account was not created.",
        500
      );
    }

    authUserId = authData.user.id;

    /*
     * ---------------------------------------------------------
     * 16. Create profile
     * ---------------------------------------------------------
     */

    const { error: newProfileError } =
      await supabaseAdmin
        .from("profiles")
        .insert({
          id: authUserId,
          role: "student",
          first_name: firstName,
          middle_name: middleName || null,
          last_name: lastName,
          email,
          phone: phone || null,
        });

    if (newProfileError) {
      console.error(
        "Profile creation failed:",
        newProfileError
      );

      throw new Error(
        "Unable to create the student's profile."
      );
    }

    profileCreated = true;

    /*
     * ---------------------------------------------------------
     * 17. Create student record
     * ---------------------------------------------------------
     */

    const {
      data: newStudent,
      error: newStudentError,
    } = await supabaseAdmin
      .from("students")
      .insert({
        user_id: authUserId,
        student_id: studentId,
        class_id: classId,
        admission_number:
          admissionNumber || null,
        admission_date: admissionDate,
        date_of_birth: dateOfBirth,
        status: "active",
        full_name: [
          firstName,
          middleName,
          lastName,
        ]
          .filter(Boolean)
          .join(" "),
        phone: phone || null,
        address: address || null,
        state: state || null,
        lga: lga || null,
        guardian_name:
          guardianName || null,
        guardian_phone:
          guardianPhone || null,
      })
      .select("id")
      .single();

    if (newStudentError) {
      console.error(
        "Student record creation failed:",
        newStudentError
      );

      throw new Error(
        "Unable to create the student's record."
      );
    }

    if (!newStudent) {
      throw new Error(
        "Student record was not created."
      );
    }

    studentCreated = true;

    /*
     * ---------------------------------------------------------
     * 18. Create current-session enrollment
     * ---------------------------------------------------------
     */

    const {
      error: enrollmentError,
    } = await supabaseAdmin
      .from("student_enrollments")
      .insert({
        student_id: newStudent.id,
        session_id: currentSession.id,
        class_id: classId,
        enrollment_date:
          admissionDate ||
          new Date()
            .toISOString()
            .split("T")[0],
        status: "active",
      });

    if (enrollmentError) {
      console.error(
        "Enrollment creation failed:",
        enrollmentError
      );

      throw new Error(
        "Unable to create the student's academic enrollment."
      );
    }

    /*
     * ---------------------------------------------------------
     * 19. Success
     * ---------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        student: {
          id: newStudent.id,
          studentId,
          email,
          fullName: [
            firstName,
            middleName,
            lastName,
          ]
            .filter(Boolean)
            .join(" "),
          classId,
          className: classRow.name,
          sessionId: currentSession.id,
          sessionName: currentSession.name,
        },

        /*
         * Returned once to the administrator who created
         * the student.
         *
         * The password is NOT stored in our database.
         */
        temporaryPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    /*
     * ---------------------------------------------------------
     * 20. Rollback / cleanup
     * ---------------------------------------------------------
     */

    console.error(
      "Student creation transaction failed:",
      error
    );

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

      const serviceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (
        supabaseUrl &&
        serviceRoleKey &&
        authUserId
      ) {
        const supabaseAdmin = createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );

        /*
         * Delete student record first.
         */
        if (studentCreated) {
          await supabaseAdmin
            .from("students")
            .delete()
            .eq(
              "user_id",
              authUserId
            );
        }

        /*
         * Delete profile.
         */
        if (profileCreated) {
          await supabaseAdmin
            .from("profiles")
            .delete()
            .eq(
              "id",
              authUserId
            );
        }

        /*
         * Finally delete Auth account.
         */
        await supabaseAdmin.auth.admin.deleteUser(
          authUserId
        );
      }
    } catch (cleanupError) {
      console.error(
        "Student creation cleanup failed:",
        cleanupError
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create student.";

    return errorResponse(
      message,
      500
    );
  }
}