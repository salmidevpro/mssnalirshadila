"use client";

import {
  AlertCircle,
  Camera,
  Check,
  ChevronDown,
  Edit3,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

const MAX_PROFILE_IMAGE_SIZE = 500 * 1024;
const PROFILE_BUCKET = "student-profiles";

type Profile = {
  first_name: string;
  last_name: string;
  email: string;
};

type Student = {
  id: string;
  user_id: string;
  student_id: string;
  class_id: string | null;
  admission_number: string | null;
  admission_date: string | null;
  date_of_birth: string | null;
  status: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  lga: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  profile_photo: string | null;
};

type ClassRecord = {
  id: string;
  name: string;
};

type FormData = {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  address: string;
  state: string;
  lga: string;
  guardian_name: string;
  guardian_phone: string;
};

const NIGERIAN_STATES: Record<string, string[]> = {
  Abia: [
    "Aba North",
    "Aba South",
    "Arochukwu",
    "Bende",
    "Ikwuano",
    "Isiala Ngwa North",
    "Isiala Ngwa South",
    "Isuikwuato",
    "Obi Ngwa",
    "Ohafia",
    "Osisioma Ngwa",
    "Ugwunagbo",
    "Ukwa East",
    "Ukwa West",
    "Umuahia North",
    "Umuahia South",
    "Umunneochi",
  ],

  Adamawa: [
    "Demsa",
    "Fufore",
    "Ganye",
    "Girei",
    "Gombi",
    "Guyuk",
    "Hong",
    "Jada",
    "Lamurde",
    "Madagali",
    "Maiha",
    "Mayo-Belwa",
    "Michika",
    "Mubi North",
    "Mubi South",
    "Numan",
    "Shelleng",
    "Song",
    "Toungo",
    "Yola North",
    "Yola South",
  ],

  Akwa_Ibom: [
    "Abak",
    "Eastern Obolo",
    "Eket",
    "Esit Eket",
    "Essien Udim",
    "Etim Ekpo",
    "Etinan",
    "Ibeno",
    "Ibesikpo Asutan",
    "Ibiono Ibom",
    "Ika",
    "Ikono",
    "Ikot Abasi",
    "Ikot Ekpene",
    "Ini",
    "Itu",
    "Mbo",
    "Mkpat Enin",
    "Nsit Atai",
    "Nsit Ibom",
    "Nsit Ubium",
    "Obot Akara",
    "Okobo",
    "Onna",
    "Oron",
    "Oruk Anam",
    "Udung Uko",
    "Ukanafun",
    "Uruan",
    "Urue Offong/Oruko",
    "Uyo",
  ],

  Anambra: [
    "Aguata",
    "Anambra East",
    "Anambra West",
    "Anaocha",
    "Awka North",
    "Awka South",
    "Ayamelum",
    "Dunukofia",
    "Ekwusigo",
    "Idemili North",
    "Idemili South",
    "Ihiala",
    "Njikoka",
    "Nnewi North",
    "Nnewi South",
    "Ogbaru",
    "Onitsha North",
    "Onitsha South",
    "Orumba North",
    "Orumba South",
    "Oyi",
  ],

  Bauchi: [
    "Bauchi",
    "Bogoro",
    "Damban",
    "Darazo",
    "Dass",
    "Gamawa",
    "Ganjuwa",
    "Giade",
    "Itas/Gadau",
    "Jama'are",
    "Katagum",
    "Kirfi",
    "Misau",
    "Ningi",
    "Shira",
    "Tafawa Balewa",
    "Toro",
    "Warji",
    "Zaki",
  ],

  Bayelsa: [
    "Brass",
    "Ekeremor",
    "Kolokuma/Opokuma",
    "Nembe",
    "Ogbia",
    "Sagbama",
    "Southern Ijaw",
    "Yenagoa",
  ],

  Benue: [
    "Ado",
    "Agatu",
    "Apa",
    "Buruku",
    "Gbajimba",
    "Guma",
    "Gwer East",
    "Gwer West",
    "Katsina-Ala",
    "Konshisha",
    "Kwande",
    "Logo",
    "Makurdi",
    "Obi",
    "Ogbadibo",
    "Ohimini",
    "Oju",
    "Okpokwu",
    "Oturkpo",
    "Tarka",
    "Ukum",
    "Ushongo",
    "Vandeikya",
  ],

  Borno: [
    "Abadam",
    "Askira/Uba",
    "Bama",
    "Bayo",
    "Biu",
    "Chibok",
    "Damboa",
    "Dikwa",
    "Gubio",
    "Guzamala",
    "Gwoza",
    "Hawul",
    "Jere",
    "Kaga",
    "Kala/Balge",
    "Konduga",
    "Kukawa",
    "Kwaya Kusar",
    "Mafa",
    "Magumeri",
    "Maiduguri",
    "Marte",
    "Mobbar",
    "Monguno",
    "Ngala",
    "Nganzai",
    "Shani",
  ],

  Cross_River: [
    "Abi",
    "Akamkpa",
    "Akpabuyo",
    "Bakassi",
    "Bekwarra",
    "Biase",
    "Boki",
    "Calabar Municipal",
    "Calabar South",
    "Etung",
    "Ikom",
    "Obanliku",
    "Obubra",
    "Obudu",
    "Odukpani",
    "Ogoja",
    "Yakuur",
    "Yala",
  ],

  Delta: [
    "Aniocha North",
    "Aniocha South",
    "Bomadi",
    "Burutu",
    "Ethiope East",
    "Ethiope West",
    "Ika North East",
    "Ika South",
    "Isoko North",
    "Isoko South",
    "Ndokwa East",
    "Ndokwa West",
    "Okpe",
    "Oshimili North",
    "Oshimili South",
    "Patani",
    "Sapele",
    "Udu",
    "Ughelli North",
    "Ughelli South",
    "Ukwuani",
    "Uvwie",
    "Warri North",
    "Warri South",
    "Warri South West",
  ],

  Ebonyi: [
    "Abakaliki",
    "Afikpo North",
    "Afikpo South",
    "Ebonyi",
    "Ezza North",
    "Ezza South",
    "Ikwo",
    "Ishielu",
    "Ivo",
    "Izzi",
    "Ohaukwu",
    "Onicha",
  ],

  Edo: [
    "Akoko-Edo",
    "Egor",
    "Esan Central",
    "Esan North-East",
    "Esan South-East",
    "Esan West",
    "Etsako Central",
    "Etsako East",
    "Etsako West",
    "Igueben",
    "Ikpoba-Okha",
    "Oredo",
    "Orhionmwon",
    "Ovia North-East",
    "Ovia South-West",
    "Owan East",
    "Owan West",
    "Uhunmwonde",
  ],

  Ekiti: [
    "Ado Ekiti",
    "Efon",
    "Ekiti East",
    "Ekiti South-West",
    "Ekiti West",
    "Emure",
    "Gbonyin",
    "Ido-Osi",
    "Ijero",
    "Ikere",
    "Ikole",
    "Ilejemeje",
    "Irepodun/Ifelodun",
    "Ise/Orun",
    "Moba",
    "Oye",
  ],

  Enugu: [
    "Aninri",
    "Awgu",
    "Enugu East",
    "Enugu North",
    "Enugu South",
    "Ezeagu",
    "Igbo Etiti",
    "Igbo Eze North",
    "Igbo Eze South",
    "Isi Uzo",
    "Nkanu East",
    "Nkanu West",
    "Nsukka",
    "Oji River",
    "Udenu",
    "Udi",
    "Uzo-Uwani",
  ],

  Gombe: [
    "Akko",
    "Balanga",
    "Billiri",
    "Dukku",
    "Funakaye",
    "Gombe",
    "Kaltungo",
    "Kwami",
    "Nafada",
    "Shongom",
    "Yamaltu/Deba",
  ],

  Imo: [
    "Ahiazu Mbaise",
    "Ehime Mbano",
    "Ezinihitte",
    "Ideato North",
    "Ideato South",
    "Ihitte/Uboma",
    "Ikeduru",
    "Isiala Mbano",
    "Mbaitoli",
    "Ngor Okpala",
    "Njaba",
    "Nkwerre",
    "Nwangele",
    "Obowo",
    "Oguta",
    "Ohaji/Egbema",
    "Okigwe",
    "Orlu",
    "Orsu",
    "Oru East",
    "Oru West",
    "Owerri Municipal",
    "Owerri North",
    "Owerri West",
    "Unuimo",
  ],

  Jigawa: [
    "Auyo",
    "Babura",
    "Biriniwa",
    "Birnin Kudu",
    "Buji",
    "Dutse",
    "Gagarawa",
    "Garki",
    "Gumel",
    "Guri",
    "Gwaram",
    "Gwiwa",
    "Hadejia",
    "Jahun",
    "Kafin Hausa",
    "Kaugama",
    "Kazaure",
    "Kiri Kasama",
    "Kiyawa",
    "Maigatari",
    "Malam Madori",
    "Miga",
    "Ringim",
    "Roni",
    "Sule Tankarkar",
    "Taura",
    "Yankwashi",
  ],

  Kaduna: [
    "Birnin Gwari",
    "Chikun",
    "Giwa",
    "Igabi",
    "Ikara",
    "Jaba",
    "Jema'a",
    "Kachia",
    "Kaura",
    "Kauru",
    "Kubau",
    "Kudan",
    "Lere",
    "Makarfi",
    "Sabon Gari",
    "Sanga",
    "Soba",
    "Zangon Kataf",
    "Zaria",
  ],

  Kano: [
    "Ajingi",
    "Albasu",
    "Bagwai",
    "Bebeji",
    "Bichi",
    "Bunkure",
    "Dala",
    "Dambatta",
    "Dawakin Kudu",
    "Dawakin Tofa",
    "Doguwa",
    "Fagge",
    "Gabasawa",
    "Garko",
    "Garun Mallam",
    "Gaya",
    "Gezawa",
    "Gwale",
    "Gwarzo",
    "Kabo",
    "Kano Municipal",
    "Karaye",
    "Kibiya",
    "Kiru",
    "Kumbotso",
    "Kunchi",
    "Kura",
    "Madobi",
    "Makoda",
    "Minjibir",
    "Nasarawa",
    "Rano",
    "Rimin Gado",
    "Rogo",
    "Shanono",
    "Sumaila",
    "Takai",
    "Tarauni",
    "Tofa",
    "Tsanyawa",
    "Tudun Wada",
    "Ungogo",
    "Warawa",
    "Wudil",
  ],

  Katsina: [
    "Bakori",
    "Batagarawa",
    "Batsari",
    "Baure",
    "Bindawa",
    "Charanchi",
    "Dan Musa",
    "Dandume",
    "Danja",
    "Daura",
    "Dutsi",
    "Dutsin-Ma",
    "Faskari",
    "Funtua",
    "Ingawa",
    "Jibia",
    "Kafur",
    "Kaita",
    "Kankara",
    "Kankia",
    "Katsina",
    "Kurfi",
    "Kusada",
    "Mai'Adua",
    "Malumfashi",
    "Mani",
    "Mashi",
    "Matazu",
    "Musawa",
    "Rimi",
    "Sabuwa",
    "Safana",
    "Sandamu",
    "Zango",
  ],

  Kebbi: [
    "Aleiro",
    "Arewa Dandi",
    "Argungu",
    "Augie",
    "Bagudo",
    "Birnin Kebbi",
    "Bunza",
    "Dandi",
    "Danko/Wasagu",
    "Fakai",
    "Gwandu",
    "Jega",
    "Kalgo",
    "Koko/Besse",
    "Maiyama",
    "Ngaski",
    "Sakaba",
    "Shanga",
    "Suru",
    "Wasagu/Danko",
    "Yauri",
    "Zuru",
  ],

  Kogi: [
    "Adavi",
    "Ajaokuta",
    "Ankpa",
    "Bassa",
    "Dekina",
    "Ibaji",
    "Idah",
    "Igalamela-Odolu",
    "Ijumu",
    "Kabba/Bunu",
    "Kogi",
    "Lokoja",
    "Mopa-Muro",
    "Ofu",
    "Ogori/Magongo",
    "Okehi",
    "Okene",
    "Olamaboro",
    "Omala",
    "Yagba East",
    "Yagba West",
  ],

  Kwara: [
    "Asa",
    "Baruten",
    "Edu",
    "Ekiti",
    "Ilorin East",
    "Ilorin South",
    "Ilorin West",
    "Irepodun",
    "Isin",
    "Kaiama",
    "Moro",
    "Offa",
    "Oke Ero",
    "Oyun",
    "Pategi",
  ],

  Lagos: [
    "Agege",
    "Ajeromi-Ifelodun",
    "Alimosho",
    "Amuwo-Odofin",
    "Apapa",
    "Badagry",
    "Epe",
    "Eti-Osa",
    "Ibeju-Lekki",
    "Ifako-Ijaiye",
    "Ikeja",
    "Ikorodu",
    "Kosofe",
    "Lagos Island",
    "Lagos Mainland",
    "Mushin",
    "Ojo",
    "Oshodi-Isolo",
    "Shomolu",
    "Surulere",
  ],

  Nasarawa: [
    "Akwanga",
    "Awe",
    "Doma",
    "Karu",
    "Keana",
    "Keffi",
    "Kokona",
    "Lafia",
    "Nasarawa",
    "Nasarawa Eggon",
    "Obi",
    "Toto",
    "Wamba",
  ],

  Niger: [
    "Agaie",
    "Agwara",
    "Bida",
    "Borgu",
    "Bosso",
    "Chanchaga",
    "Edati",
    "Gbako",
    "Gurara",
    "Katcha",
    "Kontagora",
    "Lapai",
    "Lavun",
    "Magama",
    "Mariga",
    "Mashegu",
    "Mokwa",
    "Munya",
    "Paikoro",
    "Rafi",
    "Rijau",
    "Shiroro",
    "Suleja",
    "Tafa",
    "Wushishi",
  ],

  Ogun: [
    "Abeokuta North",
    "Abeokuta South",
    "Ado-Odo/Ota",
    "Ewekoro",
    "Ifo",
    "Ijebu East",
    "Ijebu North",
    "Ijebu North East",
    "Ijebu Ode",
    "Ikenne",
    "Imeko Afon",
    "Ipokia",
    "Obafemi Owode",
    "Odeda",
    "Odogbolu",
    "Ogun Waterside",
    "Remo North",
    "Sagamu",
    "Yewa North",
    "Yewa South",
  ],

  Ondo: [
    "Akoko North-East",
    "Akoko North-West",
    "Akoko South-East",
    "Akoko South-West",
    "Akure North",
    "Akure South",
    "Ese Odo",
    "Idanre",
    "Ifedore",
    "Ilaje",
    "Ile Oluji/Okeigbo",
    "Irele",
    "Odigbo",
    "Okitipupa",
    "Ondo East",
    "Ondo West",
    "Ose",
    "Owo",
  ],

  Osun: [
    "Atakunmosa East",
    "Atakunmosa West",
    "Ayedaade",
    "Ayedire",
    "Boripe",
    "Boluwaduro",
    "Ede North",
    "Ede South",
    "Egbedore",
    "Ejigbo",
    "Ife Central",
    "Ife East",
    "Ife North",
    "Ife South",
    "Ila",
    "Ilesa East",
    "Ilesa West",
    "Irepodun",
    "Irewole",
    "Isokan",
    "Iwo",
    "Obokun",
    "Odo Otin",
    "Ola Oluwa",
    "Olorunda",
    "Oriade",
    "Orioluwa",
    "Osogbo",
  ],

  Oyo: [
    "Afijio",
    "Akinyele",
    "Atiba",
    "Atisbo",
    "Egbeda",
    "Ibadan North",
    "Ibadan North-East",
    "Ibadan North-West",
    "Ibadan South-East",
    "Ibadan South-West",
    "Ibarapa Central",
    "Ibarapa East",
    "Ibarapa North",
    "Ido",
    "Irepo",
    "Iseyin",
    "Itesiwaju",
    "Iwajowa",
    "Kajola",
    "Lagelu",
    "Ogbomosho North",
    "Ogbomosho South",
    "Ogo Oluwa",
    "Olorunsogo",
    "Oluyole",
    "Ona Ara",
    "Orelope",
    "Ori Ire",
    "Oyo East",
    "Oyo West",
    "Saki East",
    "Saki West",
    "Surulere",
  ],

  Plateau: [
    "Barkin Ladi",
    "Bassa",
    "Bokkos",
    "Jos East",
    "Jos North",
    "Jos South",
    "Kanam",
    "Kanke",
    "Langtang North",
    "Langtang South",
    "Mangu",
    "Mikang",
    "Pankshin",
    "Qua'an Pan",
    "Riyom",
    "Shendam",
    "Wase",
  ],

  Rivers: [
    "Abua/Odual",
    "Ahoada East",
    "Ahoada West",
    "Akuku-Toru",
    "Andoni",
    "Asari-Toru",
    "Bonny",
    "Degema",
    "Eleme",
    "Emohua",
    "Etche",
    "Gokana",
    "Ikwerre",
    "Khana",
    "Obio/Akpor",
    "Ogba/Egbema/Ndoni",
    "Ogu/Bolo",
    "Okrika",
    "Omuma",
    "Opobo/Nkoro",
    "Oyigbo",
    "Port Harcourt",
    "Tai",
  ],

  Sokoto: [
    "Binji",
    "Bodinga",
    "Dange Shuni",
    "Gada",
    "Goronyo",
    "Gudu",
    "Gwadabawa",
    "Illela",
    "Isa",
    "Kebbe",
    "Kware",
    "Rabah",
    "Sabon Birni",
    "Shagari",
    "Silame",
    "Sokoto North",
    "Sokoto South",
    "Tambuwal",
    "Tangaza",
    "Tureta",
    "Wamakko",
    "Wurno",
    "Yabo",
  ],

  Taraba: [
    "Ardo-Kola",
    "Bali",
    "Donga",
    "Gashaka",
    "Gassol",
    "Ibi",
    "Jalingo",
    "Karim Lamido",
    "Kumi",
    "Lau",
    "Sardauna",
    "Takum",
    "Ussa",
    "Wukari",
    "Yorro",
    "Zing",
  ],

  Yobe: [
    "Bade",
    "Bursari",
    "Damaturu",
    "Fika",
    "Fune",
    "Geidam",
    "Gujba",
    "Gulani",
    "Jakusko",
    "Karasuwa",
    "Machina",
    "Nangere",
    "Nguru",
    "Potiskum",
    "Tarmuwa",
    "Yunusari",
    "Yusufari",
  ],

  Zamfara: [
    "Anka",
    "Bakura",
    "Birnin Magaji/Kiyaw",
    "Bukkuyum",
    "Bungudu",
    "Gummi",
    "Gusau",
    "Kaura Namoda",
    "Maradun",
    "Maru",
    "Shinkafi",
    "Talata Mafara",
    "Tsafe",
    "Zurmi",
  ],

  FCT: [
    "Abuja Municipal",
    "Bwari",
    "Gwagwalada",
    "Kuje",
    "Kwali",
    "Abaji",
  ],
};

const STATE_LABELS: Record<string, string> = {
  Akwa_Ibom: "Akwa Ibom",
  Cross_River: "Cross River",
};

const getStateLabel = (state: string) =>
  STATE_LABELS[state] ?? state;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatDate(value: string | null) {
  if (!value) return "Not provided";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function initials(firstName: string, lastName: string) {
  const first = firstName?.trim()?.charAt(0) ?? "";
  const last = lastName?.trim()?.charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || "ST";
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function isAllowedImage(file: File) {
  return [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ].includes(file.type);
}

function getStoragePathFromPhoto(photo: string | null) {
  if (!photo) return null;

  /*
   * Supports both:
   *
   * 1. Stored storage path:
   *    user-id/profile.jpg
   *
   * 2. Full public URL:
   *    https://.../storage/v1/object/public/student-profiles/user-id/profile.jpg
   */
  try {
    if (photo.startsWith("http")) {
      const marker = `/storage/v1/object/public/${PROFILE_BUCKET}/`;

      const markerIndex = photo.indexOf(marker);

      if (markerIndex !== -1) {
        return decodeURIComponent(
          photo.slice(markerIndex + marker.length),
        );
      }
    }
  } catch {
    return null;
  }

  return photo;
}

export default function StudentProfilePage() {
  const supabase = useMemo(() => createClient(), []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [classRecord, setClassRecord] =
    useState<ClassRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [photoUploading, setPhotoUploading] =
    useState(false);

  const [photoRemoving, setPhotoRemoving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState<string | null>(null);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const [photoMessage, setPhotoMessage] =
    useState<string | null>(null);

  const [photoError, setPhotoError] =
    useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    address: "",
    state: "",
    lga: "",
    guardian_name: "",
    guardian_phone: "",
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          `Unable to load your account profile: ${profileError.message}`,
        );
      }

      const {
        data: studentData,
        error: studentError,
      } = await supabase
        .from("students")
        .select(
          `
            id,
            user_id,
            student_id,
            class_id,
            admission_number,
            admission_date,
            date_of_birth,
            status,
            full_name,
            phone,
            address,
            state,
            lga,
            guardian_name,
            guardian_phone,
            profile_photo
          `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (studentError) {
        throw new Error(
          `Unable to load your student profile: ${studentError.message}`,
        );
      }

      if (!studentData) {
        throw new Error(
          "Your student record could not be found. Please contact the school administration.",
        );
      }

      let loadedClass: ClassRecord | null = null;

      if (studentData.class_id) {
        const {
          data: classData,
          error: classError,
        } = await supabase
          .from("classes")
          .select("id, name")
          .eq("id", studentData.class_id)
          .maybeSingle();

        if (!classError && classData) {
          loadedClass = classData;
        }
      }

      const resolvedProfile: Profile = {
        first_name:
          profileData?.first_name ??
          studentData.full_name?.split(" ")[0] ??
          "",
        last_name: profileData?.last_name ?? "",
        email: profileData?.email ?? user.email ?? "",
      };

      setProfile(resolvedProfile);
      setStudent(studentData as Student);
      setClassRecord(loadedClass);

      setForm({
        first_name: resolvedProfile.first_name,
        last_name: resolvedProfile.last_name,
        phone: studentData.phone ?? "",
        date_of_birth: studentData.date_of_birth ?? "",
        address: studentData.address ?? "",
        state: studentData.state ?? "",
        lga: studentData.lga ?? "",
        guardian_name: studentData.guardian_name ?? "",
        guardian_phone: studentData.guardian_phone ?? "",
      });
    } catch (err) {
      console.error("Profile loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, [loadProfile]);

  const openEdit = () => {
    if (!profile || !student) return;

    setForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: student.phone ?? "",
      date_of_birth: student.date_of_birth ?? "",
      address: student.address ?? "",
      state: student.state ?? "",
      lga: student.lga ?? "",
      guardian_name: student.guardian_name ?? "",
      guardian_phone: student.guardian_phone ?? "",
    });

    setSaveMessage(null);
    setSaveError(null);
    setPhotoMessage(null);
    setPhotoError(null);

    setEditOpen(true);
  };

  const closeEdit = () => {
    if (saving || photoUploading || photoRemoving) {
      return;
    }

    setEditOpen(false);
    setSaveError(null);
    setSaveMessage(null);
    setPhotoError(null);
    setPhotoMessage(null);
  };

  const updateForm = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleStateChange = (state: string) => {
    setForm((current) => ({
      ...current,
      state,
      lga: "",
    }));
  };

  /*
   * =========================================================
   * PROFILE PHOTO UPLOAD
   * =========================================================
   */

  const uploadProfilePhoto = async (file: File) => {
    if (!student) return;

    setPhotoError(null);
    setPhotoMessage(null);

    if (!isAllowedImage(file)) {
      setPhotoError(
        "Please choose a JPG, PNG, or WebP image.",
      );
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setPhotoError(
        "Profile photo must not be larger than 500 KB.",
      );
      return;
    }

    try {
      setPhotoUploading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("Your login session has expired.");
      }

      const extension = getFileExtension(file);

      /*
       * Keep one predictable photo per student.
       *
       * Example:
       * student-user-id/profile.jpg
       */
      const storagePath = `${user.id}/profile.${extension}`;

      /*
       * Delete previous versions first.
       *
       * This also handles the situation where the old file
       * had a different extension.
       */
      const oldPhotoPath = getStoragePathFromPhoto(
        student.profile_photo,
      );

      const possibleOldPaths = [
        oldPhotoPath,
        `${user.id}/profile.jpg`,
        `${user.id}/profile.jpeg`,
        `${user.id}/profile.png`,
        `${user.id}/profile.webp`,
      ].filter(
        (path, index, array): path is string =>
          Boolean(path) &&
          array.indexOf(path) === index &&
          path !== storagePath,
      );

      if (possibleOldPaths.length > 0) {
        const {
          error: removeOldError,
        } = await supabase.storage
          .from(PROFILE_BUCKET)
          .remove(possibleOldPaths);

        /*
         * Don't fail the whole upload simply because an old
         * file doesn't exist anymore.
         */
        if (removeOldError) {
          console.warn(
            "Unable to remove old profile photo:",
            removeOldError.message,
          );
        }
      }

      /*
       * Upload with upsert so the same profile path can
       * safely be replaced.
       */
      const {
        error: uploadError,
      } = await supabase.storage
        .from(PROFILE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(
          `Unable to upload your profile photo: ${uploadError.message}`,
        );
      }

      /*
       * Since your bucket is public, getPublicUrl gives us
       * a URL that can be displayed directly by <img>.
       */
      const {
        data: publicUrlData,
      } = supabase.storage
        .from(PROFILE_BUCKET)
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "The photo uploaded, but its public URL could not be generated.",
        );
      }

      /*
       * Store the URL in students.profile_photo.
       */
      const {
        error: databaseError,
      } = await supabase
        .from("students")
        .update({
          profile_photo: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", student.id)
        .eq("user_id", user.id);

      if (databaseError) {
        /*
         * Roll back uploaded file if database update fails.
         */
        await supabase.storage
          .from(PROFILE_BUCKET)
          .remove([storagePath]);

        throw new Error(
          `Photo uploaded but could not be saved to your profile: ${databaseError.message}`,
        );
      }

      /*
       * Add a cache-busting query parameter so the browser
       * doesn't continue showing the previous cached image.
       */
      const displayUrl = `${publicUrl}?v=${Date.now()}`;

      setStudent((current) =>
        current
          ? {
              ...current,
              profile_photo: displayUrl,
            }
          : current,
      );

      setPhotoMessage(
        "Profile photo updated successfully.",
      );
    } catch (err) {
      console.error("Profile photo upload error:", err);

      setPhotoError(
        err instanceof Error
          ? err.message
          : "Unable to upload your profile photo.",
      );
    } finally {
      setPhotoUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePhotoInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    void uploadProfilePhoto(file);
  };

  const removeProfilePhoto = async () => {
    if (!student) return;

    setPhotoError(null);
    setPhotoMessage(null);

    if (!student.profile_photo) {
      return;
    }

    try {
      setPhotoRemoving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("Your login session has expired.");
      }

      const photoPath = getStoragePathFromPhoto(
        student.profile_photo,
      );

      if (photoPath) {
        const {
          error: storageError,
        } = await supabase.storage
          .from(PROFILE_BUCKET)
          .remove([photoPath]);

        if (storageError) {
          console.warn(
            "Unable to remove photo from storage:",
            storageError.message,
          );
        }
      }

      const {
        error: databaseError,
      } = await supabase
        .from("students")
        .update({
          profile_photo: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", student.id)
        .eq("user_id", user.id);

      if (databaseError) {
        throw new Error(
          `Unable to remove your profile photo: ${databaseError.message}`,
        );
      }

      setStudent((current) =>
        current
          ? {
              ...current,
              profile_photo: null,
            }
          : current,
      );

      setPhotoMessage(
        "Profile photo removed successfully.",
      );
    } catch (err) {
      console.error("Profile photo removal error:", err);

      setPhotoError(
        err instanceof Error
          ? err.message
          : "Unable to remove your profile photo.",
      );
    } finally {
      setPhotoRemoving(false);
    }
  };

  /*
   * =========================================================
   * SAVE PROFILE DETAILS
   * =========================================================
   */

  const saveProfile = async () => {
    if (!student || !profile) return;

    setSaveError(null);
    setSaveMessage(null);

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const phone = onlyDigits(form.phone);
    const guardianPhone = onlyDigits(form.guardian_phone);
    const address = form.address.trim();
    const guardianName = form.guardian_name.trim();

    if (!firstName) {
      setSaveError("Please enter your first name.");
      return;
    }

    if (!lastName) {
      setSaveError("Please enter your last name.");
      return;
    }

    if (phone && phone.length !== 11) {
      setSaveError(
        "Your phone number must contain exactly 11 digits.",
      );
      return;
    }

    if (guardianPhone && guardianPhone.length !== 11) {
      setSaveError(
        "Guardian phone number must contain exactly 11 digits.",
      );
      return;
    }

    if (form.state && !form.lga) {
      setSaveError(
        "Please select your Local Government Area.",
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("Your login session has expired.");
      }

      /*
       * Update the authenticated user's profile record.
       *
       * This is what makes the new first/last name persistent
       * in the profiles table.
       */
      const {
        error: profileUpdateError,
      } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", user.id);

      if (profileUpdateError) {
        throw new Error(
          `Unable to update your account information: ${profileUpdateError.message}`,
        );
      }

      /*
       * Keep students.full_name synchronized.
       */
      const fullName = `${firstName} ${lastName}`.trim();

      const {
        error: studentUpdateError,
      } = await supabase
        .from("students")
        .update({
          full_name: fullName,
          phone: phone || null,
          date_of_birth: form.date_of_birth || null,
          address: address || null,
          state: form.state || null,
          lga: form.lga || null,
          guardian_name: guardianName || null,
          guardian_phone: guardianPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", student.id)
        .eq("user_id", user.id);

      if (studentUpdateError) {
        throw new Error(
          `Unable to update your student information: ${studentUpdateError.message}`,
        );
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              first_name: firstName,
              last_name: lastName,
            }
          : current,
      );

      setStudent((current) =>
        current
          ? {
              ...current,
              full_name: fullName,
              phone: phone || null,
              date_of_birth: form.date_of_birth || null,
              address: address || null,
              state: form.state || null,
              lga: form.lga || null,
              guardian_name: guardianName || null,
              guardian_phone: guardianPhone || null,
              updated_at: new Date().toISOString(),
            }
          : current,
      );

      setSaveMessage(
        "Your profile has been updated successfully.",
      );

      window.setTimeout(() => {
        setEditOpen(false);
        setSaveMessage(null);
      }, 1200);
    } catch (err) {
      console.error("Profile update error:", err);

      setSaveError(
        err instanceof Error
          ? err.message
          : "Unable to save your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const availableLgas = form.state
    ? NIGERIAN_STATES[form.state] ?? []
    : [];

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "Student";

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="border-b border-slate-200 bg-white px-5 py-8 sm:px-8">
          <div className="animate-pulse">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-56 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
          </div>
        </div>

        <main className="px-5 py-8 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="h-72 animate-pulse rounded-3xl bg-white" />
            <div className="h-72 animate-pulse rounded-3xl bg-white" />
          </div>
        </main>
      </div>
    );
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (error || !profile || !student) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={25} />
          </div>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
            Profile Error
          </p>

          <h1
            className="mt-2 text-xl font-black"
            style={{ color: SCHOOL_BLUE_DARK }}
          >
            Unable to load profile
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ?? "Your profile could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => void loadProfile()}
            className="mt-6 rounded-full px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <div className="min-h-full bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.22em]"
                style={{ color: SCHOOL_GOLD }}
              >
                Account
              </p>

              <h1
                className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                My Profile
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                View and manage your personal student information.
              </p>
            </div>

            <button
              type="button"
              onClick={openEdit}
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ backgroundColor: SCHOOL_BLUE }}
            >
              <Edit3 size={16} />
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      <main className="px-5 py-7 sm:px-8 sm:py-9">
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          {/* PROFILE CARD */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_45px_rgba(1,0,102,0.045)]">
            <div
              className="relative overflow-hidden px-6 pb-7 pt-8"
              style={{ backgroundColor: SCHOOL_BLUE }}
            >
              <div
                className="absolute -right-14 -top-16 h-44 w-44 rounded-full blur-3xl"
                style={{
                  backgroundColor: `${SCHOOL_GOLD}25`,
                }}
              />

              <div
                className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full blur-3xl"
                style={{
                  backgroundColor: "#ffffff10",
                }}
              />

              <div className="relative z-10 flex flex-col items-center text-center">
                {student.profile_photo ? (
                  <Image
                    src={student.profile_photo}
                    alt={displayName}
                    width={112}
                    height={112}
                    className="h-28 w-28 rounded-3xl border-4 border-white/20 object-cover shadow-xl"
                  />
                ) : (
                  <div
                    className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-white/15 text-3xl font-black shadow-xl"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}20`,
                      color: SCHOOL_GOLD,
                    }}
                  >
                    {initials(
                      profile.first_name,
                      profile.last_name,
                    )}
                  </div>
                )}

                <h2 className="mt-5 text-xl font-black text-white">
                  {displayName}
                </h2>

                <p className="mt-1 text-xs text-white/60">
                  {student.admission_number
                    ? `Admission No. ${student.admission_number}`
                    : "Student Account"}
                </p>

                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {student.status}
                </span>
              </div>
            </div>

            <div className="space-y-1 p-5">
              <ProfileMiniRow
                icon={<Mail size={16} />}
                label="Email"
                value={profile.email || "Not provided"}
              />

              <ProfileMiniRow
                icon={<Phone size={16} />}
                label="Phone"
                value={student.phone || "Not provided"}
              />

              <ProfileMiniRow
                icon={<GraduationCap size={16} />}
                label="Class"
                value={classRecord?.name || "Not assigned"}
              />

              <ProfileMiniRow
                icon={<MapPin size={16} />}
                label="Location"
                value={
                  student.state
                    ? `${getStateLabel(student.state)}${
                        student.lga
                          ? `, ${student.lga}`
                          : ""
                      }`
                    : "Not provided"
                }
              />
            </div>
          </section>

          {/* DETAILS */}

          <div className="space-y-5">
            <InfoSection
              icon={<User size={18} />}
              title="Personal Information"
            >
              <DetailItem
                label="First Name"
                value={profile.first_name || "Not provided"}
              />

              <DetailItem
                label="Last Name"
                value={profile.last_name || "Not provided"}
              />

              <DetailItem
                label="Date of Birth"
                value={formatDate(student.date_of_birth)}
              />

              <DetailItem
                label="Phone Number"
                value={student.phone || "Not provided"}
              />
            </InfoSection>

            <InfoSection
              icon={<MapPin size={18} />}
              title="Address Information"
            >
              <DetailItem
                label="Address"
                value={student.address || "Not provided"}
                full
              />

              <DetailItem
                label="State"
                value={
                  student.state
                    ? getStateLabel(student.state)
                    : "Not provided"
                }
              />

              <DetailItem
                label="Local Government Area"
                value={student.lga || "Not provided"}
              />
            </InfoSection>

            <InfoSection
              icon={<Users size={18} />}
              title="Guardian Information"
            >
              <DetailItem
                label="Guardian Name"
                value={
                  student.guardian_name || "Not provided"
                }
              />

              <DetailItem
                label="Guardian Phone"
                value={
                  student.guardian_phone || "Not provided"
                }
              />
            </InfoSection>

            <InfoSection
              icon={<ShieldCheck size={18} />}
              title="School Information"
            >
              <DetailItem
                label="Student ID"
                value={student.student_id}
              />

              <DetailItem
                label="Admission Number"
                value={
                  student.admission_number || "Not provided"
                }
              />

              <DetailItem
                label="Admission Date"
                value={formatDate(student.admission_date)}
              />

              <DetailItem
                label="Class"
                value={classRecord?.name || "Not assigned"}
              />
            </InfoSection>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}08`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <p
                    className="text-sm font-black"
                    style={{ color: SCHOOL_BLUE_DARK }}
                  >
                    Keep your information up to date
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Accurate contact and address information helps
                    the school communicate with you and your
                    guardian when necessary.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* =====================================================
          EDIT PROFILE MODAL
      ====================================================== */}

      {editOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00004D]/45 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEdit();
            }
          }}
        >
          <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_100px_rgba(0,0,77,0.25)]">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ color: SCHOOL_GOLD }}
                >
                  Account Settings
                </p>

                <h2
                  className="mt-1 text-xl font-black"
                  style={{ color: SCHOOL_BLUE_DARK }}
                >
                  Edit Profile
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Update your personal and contact information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={
                  saving ||
                  photoUploading ||
                  photoRemoving
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}

            <div className="overflow-y-auto px-5 py-6 sm:px-7">
              {/* PHOTO */}

              <div className="mb-7">
                <SectionLabel title="Profile Photo" />

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col items-center gap-5 sm:flex-row">
                    <div className="relative shrink-0">
                      {student.profile_photo ? (
                        <Image
                          src={student.profile_photo}
                          alt={displayName}
                          width={112}
                          height={112}
                          unoptimized
                          className="h-28 w-28 rounded-3xl border-4 border-white object-cover shadow-md"
                        />
                      ) : (
                        <div
                          className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-white text-3xl font-black shadow-md"
                          style={{
                            backgroundColor: `${SCHOOL_BLUE}10`,
                            color: SCHOOL_BLUE,
                          }}
                        >
                          {initials(
                            profile.first_name,
                            profile.last_name,
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={
                          photoUploading ||
                          photoRemoving
                        }
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full border-4 border-slate-50 text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          backgroundColor: SCHOOL_BLUE,
                        }}
                        title="Change profile photo"
                      >
                        {photoUploading ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Camera size={17} />
                        )}
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="user"
                        className="hidden"
                        onChange={handlePhotoInput}
                      />
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p
                        className="text-sm font-black"
                        style={{
                          color: SCHOOL_BLUE_DARK,
                        }}
                      >
                        Profile picture
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Upload a clear photo of yourself.
                        JPG, PNG or WebP only.
                      </p>

                      <p className="mt-1 text-[10px] font-bold text-slate-400">
                        Maximum file size: 500 KB
                      </p>

                      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <button
                          type="button"
                          disabled={
                            photoUploading ||
                            photoRemoving
                          }
                          onClick={() =>
                            fileInputRef.current?.click()
                          }
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            backgroundColor: SCHOOL_BLUE,
                          }}
                        >
                          <ImageIcon size={14} />
                          {student.profile_photo
                            ? "Change Photo"
                            : "Upload Photo"}
                        </button>

                        {student.profile_photo && (
                          <button
                            type="button"
                            disabled={
                              photoUploading ||
                              photoRemoving
                            }
                            onClick={() =>
                              void removeProfilePhoto()
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2.5 text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {photoRemoving ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={14} />
                            )}

                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {photoError && (
                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3">
                      <AlertCircle
                        size={16}
                        className="mt-0.5 shrink-0 text-red-500"
                      />

                      <p className="text-[11px] font-medium leading-5 text-red-600">
                        {photoError}
                      </p>
                    </div>
                  )}

                  {photoMessage && (
                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />

                      <p className="text-[11px] font-bold leading-5 text-emerald-700">
                        {photoMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SAVE ERRORS */}

              {saveError && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-500"
                  />

                  <p className="text-xs font-medium leading-5 text-red-600">
                    {saveError}
                  </p>
                </div>
              )}

              {saveMessage && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <Check
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <p className="text-xs font-bold leading-5 text-emerald-700">
                    {saveMessage}
                  </p>
                </div>
              )}

              {/* BASIC INFORMATION */}

              <div>
                <SectionLabel title="Basic Information" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="First Name"
                    value={form.first_name}
                    onChange={(value) =>
                      updateForm("first_name", value)
                    }
                    placeholder="Enter first name"
                    required
                  />

                  <InputField
                    label="Last Name"
                    value={form.last_name}
                    onChange={(value) =>
                      updateForm("last_name", value)
                    }
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div className="mt-4">
                  <ReadOnlyField
                    label="Email Address"
                    value={profile.email}
                    icon={<Mail size={15} />}
                  />
                </div>
              </div>

              {/* CONTACT */}

              <div className="mt-7">
                <SectionLabel title="Contact Information" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <PhoneField
                    label="Phone Number"
                    value={form.phone}
                    onChange={(value) =>
                      updateForm("phone", onlyDigits(value))
                    }
                    placeholder="08012345678"
                  />

                  <InputField
                    label="Date of Birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(value) =>
                      updateForm("date_of_birth", value)
                    }
                  />
                </div>
              </div>

              {/* ADDRESS */}

              <div className="mt-7">
                <SectionLabel title="Address Information" />

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    Residential Address
                  </label>

                  <textarea
                    value={form.address}
                    onChange={(event) =>
                      updateForm(
                        "address",
                        event.target.value,
                      )
                    }
                    placeholder="Enter your full residential address"
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
                  />

                  <p className="mt-1.5 text-[10px] text-slate-400">
                    Your address can contain street numbers,
                    names, road names and other normal address
                    information.
                  </p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="State"
                    value={form.state}
                    onChange={handleStateChange}
                    options={Object.keys(NIGERIAN_STATES)}
                    labelFormatter={getStateLabel}
                    placeholder="Select your state"
                  />

                  <SelectField
                    label="Local Government Area"
                    value={form.lga}
                    onChange={(value) =>
                      updateForm("lga", value)
                    }
                    options={availableLgas}
                    disabled={!form.state}
                    placeholder={
                      form.state
                        ? "Select your LGA"
                        : "Select state first"
                    }
                  />
                </div>
              </div>

              {/* GUARDIAN */}

              <div className="mt-7">
                <SectionLabel title="Guardian Information" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="Guardian Name"
                    value={form.guardian_name}
                    onChange={(value) =>
                      updateForm(
                        "guardian_name",
                        value,
                      )
                    }
                    placeholder="Enter guardian name"
                  />

                  <PhoneField
                    label="Guardian Phone"
                    value={form.guardian_phone}
                    onChange={(value) =>
                      updateForm(
                        "guardian_phone",
                        onlyDigits(value),
                      )
                    }
                    placeholder="08012345678"
                  />
                </div>
              </div>

              {/* SCHOOL DATA */}

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <GraduationCap
                    size={17}
                    className="mt-0.5 shrink-0"
                    style={{ color: SCHOOL_BLUE }}
                  />

                  <div>
                    <p
                      className="text-xs font-black"
                      style={{
                        color: SCHOOL_BLUE_DARK,
                      }}
                    >
                      School records
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-400">
                      Student ID, admission number, admission date
                      and class are managed by the school
                      administration and cannot be edited here.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={closeEdit}
                disabled={
                  saving ||
                  photoUploading ||
                  photoRemoving
                }
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={
                  saving ||
                  photoUploading ||
                  photoRemoving
                }
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function ProfileMiniRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${SCHOOL_BLUE}08`,
          color: SCHOOL_BLUE,
        }}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

function InfoSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${SCHOOL_BLUE}08`,
            color: SCHOOL_BLUE,
          }}
        >
          {icon}
        </div>

        <h2
          className="text-sm font-black"
          style={{ color: SCHOOL_BLUE_DARK }}
        >
          {title}
        </h2>
      </div>

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p
        className="text-[10px] font-black uppercase tracking-[0.18em]"
        style={{ color: SCHOOL_BLUE }}
      >
        {title}
      </p>

      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-600">
        {label}

        {required && (
          <span className="ml-1 text-red-400">*</span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
      />
    </div>
  );
}

function PhoneField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-600">
        {label}
      </label>

      <div className="relative">
        <Phone
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={11}
          value={value}
          onChange={(event) =>
            onChange(onlyDigits(event.target.value))
          }
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm tracking-wide text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
        />
      </div>

      <p className="mt-1.5 text-[10px] text-slate-400">
        {value.length}/11 digits
      </p>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-600">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500">
        {icon}

        <span className="truncate">{value}</span>
      </div>

      <p className="mt-1.5 text-[10px] text-slate-400">
        Email is managed through your account.
      </p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  labelFormatter,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  labelFormatter?: (value: string) => string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-600">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {labelFormatter
                ? labelFormatter(option)
                : option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  );
}