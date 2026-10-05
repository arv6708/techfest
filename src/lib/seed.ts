import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { getDb, parseParticipantRow, logAuditEvent } from './db';

const DATA_DIR = path.join(process.cwd(), 'data');
export const SAMPLE_EXCEL_PATH = path.join(DATA_DIR, 'vibecode_initial_registrations.xlsx');
export const SAMPLE_CSV_PATH = path.join(DATA_DIR, 'vibecode_initial_registrations.csv');

export interface RawRegistrationRow {
  'Participant ID'?: string;
  'Full Name': string;
  'Email Address': string;
  'Phone Number': string;
  'College / Institution': string;
  'Department / Branch': string;
  'Year of Study': string;
  'State': string;
  'District': string;
  'Payment Status': string;
  'Transaction / UTR Reference'?: string;
  'Registration Timestamp': string;
  // Unknown / Custom fields from registration form
  'T-Shirt Size'?: string;
  'Laptop Required'?: string;
  'GitHub Profile'?: string;
  'Prior Hackathon Experience'?: string;
}

export const INITIAL_REGISTRATION_DATA: RawRegistrationRow[] = [
  {
    'Participant ID': 'VB26-00001',
    'Full Name': 'Arjun K. Nair',
    'Email Address': 'arjun.nair@vjec.ac.in',
    'Phone Number': '+91 98471 23456',
    'College / Institution': 'Vimal Jyothi Engineering College, Chemperi',
    'Department / Branch': 'Computer Science and Engineering',
    'Year of Study': '3rd Year',
    'State': 'Kerala',
    'District': 'Kannur',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'UPI/428910294101/SBI',
    'Registration Timestamp': '2026-09-28 09:15:22',
    'T-Shirt Size': 'L',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/arjunnair-dev',
    'Prior Hackathon Experience': 'Won 2nd in Smart India Hackathon internal'
  },
  {
    'Participant ID': 'VB26-00002',
    'Full Name': 'Sneha Mariam Roy',
    'Email Address': 'snehamariam@vjec.ac.in',
    'Phone Number': '9847234567',
    'College / Institution': 'Vimal Jyothi Engineering College, Chemperi',
    'Department / Branch': 'Artificial Intelligence and Data Science',
    'Year of Study': '2nd Year',
    'State': 'Kerala',
    'District': 'Kannur',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'GPay/741029481239',
    'Registration Timestamp': '2026-09-28 10:20:45',
    'T-Shirt Size': 'M',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/sneha-roy',
    'Prior Hackathon Experience': 'Participant in Tantra 2025'
  },
  {
    'Participant ID': 'VB26-00003',
    'Full Name': 'Muhammed Nihal',
    'Email Address': 'nihal.m@gcek.ac.in',
    'Phone Number': '9446123456',
    'College / Institution': 'Government College of Engineering Kannur',
    'Department / Branch': 'Computer Science and Engineering',
    'Year of Study': '4th Year',
    'State': 'Kerala',
    'District': 'Kannur',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'UPI/981240182410',
    'Registration Timestamp': '2026-09-28 11:45:10',
    'T-Shirt Size': 'XL',
    'Laptop Required': 'Yes',
    'GitHub Profile': 'https://github.com/nihal-codes',
    'Prior Hackathon Experience': 'State Level Web Dev finalist'
  },
  {
    'Participant ID': 'VB26-00004',
    'Full Name': 'Ananya S. Pillai',
    'Email Address': 'ananyaspillai@gmail.com',
    'Phone Number': '9745123890',
    'College / Institution': 'College of Engineering Thalassery',
    'Department / Branch': 'Information Technology',
    'Year of Study': '3rd Year',
    'State': 'Kerala',
    'District': 'Kannur',
    'Payment Status': 'PENDING',
    'Transaction / UTR Reference': '',
    'Registration Timestamp': '2026-09-29 08:30:12',
    'T-Shirt Size': 'S',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/ananyapillai',
    'Prior Hackathon Experience': 'Beginner'
  },
  {
    'Participant ID': 'VB26-00005',
    'Full Name': 'Devanand M.',
    'Email Address': 'devanand.m@vjec.ac.in',
    'Phone Number': '9188234567',
    'College / Institution': 'Vimal Jyothi Engineering College, Chemperi',
    'Department / Branch': 'Cyber Security',
    'Year of Study': '2nd Year',
    'State': 'Kerala',
    'District': 'Kannur',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'PhonePe/TXN98412849',
    'Registration Timestamp': '2026-09-29 14:12:00',
    'T-Shirt Size': 'M',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/devanand-sec',
    'Prior Hackathon Experience': 'CTF participant'
  },
  {
    'Participant ID': 'VB26-00006',
    'Full Name': 'Riya Ann Varghese',
    'Email Address': 'riya.varghese@vjec.ac.in',
    'Phone Number': '9495123456',
    'College / Institution': 'Vimal Jyothi Engineering College, Chemperi',
    'Department / Branch': 'Computer Science and Engineering',
    'Year of Study': '3rd Year',
    'State': 'Kerala',
    'District': 'Wayanad',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'UPI/382910481928',
    'Registration Timestamp': '2026-09-30 09:05:40',
    'T-Shirt Size': 'M',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/riya-varghese',
    'Prior Hackathon Experience': 'Web design enthusiast'
  },
  {
    'Participant ID': 'VB26-00007',
    'Full Name': 'Adithya Rajesh',
    'Email Address': 'adithyarajesh@sjcetpalai.ac.in',
    'Phone Number': '9846789012',
    'College / Institution': "St. Joseph's College of Engineering and Technology, Palai",
    'Department / Branch': 'Computer Science and Engineering',
    'Year of Study': '4th Year',
    'State': 'Kerala',
    'District': 'Kottayam',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'UPI/849201948192',
    'Registration Timestamp': '2026-09-30 15:40:19',
    'T-Shirt Size': 'L',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/adithyarajesh',
    'Prior Hackathon Experience': 'Full Stack Developer'
  },
  {
    'Participant ID': 'VB26-00008',
    'Full Name': 'Fathima Zahra',
    'Email Address': 'fathima.zahra@vjec.ac.in',
    'Phone Number': '9656123789',
    'College / Institution': 'Vimal Jyothi Engineering College, Chemperi',
    'Department / Branch': 'Computer Science and Engineering',
    'Year of Study': '1st Year',
    'State': 'Kerala',
    'District': 'Kozhikode',
    'Payment Status': 'PENDING',
    'Transaction / UTR Reference': '',
    'Registration Timestamp': '2026-10-01 10:11:32',
    'T-Shirt Size': 'S',
    'Laptop Required': 'Yes',
    'GitHub Profile': '',
    'Prior Hackathon Experience': 'First Hackathon'
  },
  {
    'Participant ID': 'VB26-00009',
    'Full Name': 'Kiran Thomas',
    'Email Address': 'kiran.thomas@lbscek.ac.in',
    'Phone Number': '9447890123',
    'College / Institution': 'LBS College of Engineering, Kasaragod',
    'Department / Branch': 'Electronics and Communication Engineering',
    'Year of Study': '3rd Year',
    'State': 'Kerala',
    'District': 'Kasaragod',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'Paytm/839102948192',
    'Registration Timestamp': '2026-10-01 16:22:45',
    'T-Shirt Size': 'XL',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/kiran-thomas-ec',
    'Prior Hackathon Experience': 'IoT and Hardware automation'
  },
  {
    'Participant ID': 'VB26-00010',
    'Full Name': 'Meenakshi Sundaram',
    'Email Address': 'meenakshi.s@vjec.ac.in',
    'Phone Number': '9895123456',
    'College / Institution': 'Vimal Jyothi Engineering College, Chemperi',
    'Department / Branch': 'Artificial Intelligence and Data Science',
    'Year of Study': '2nd Year',
    'State': 'Kerala',
    'District': 'Kannur',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'UPI/192840192840',
    'Registration Timestamp': '2026-10-02 11:05:00',
    'T-Shirt Size': 'M',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/meenakshi-ai',
    'Prior Hackathon Experience': 'Data science competition'
  },
  {
    'Participant ID': 'VB26-00011',
    'Full Name': 'Gokul Krishna',
    'Email Address': 'gokul.krishna@vjec.ac.in',
    'Phone Number': '9746123456',
    'College / Institution': 'Vimal Jyothi Engineering College, Chemperi',
    'Department / Branch': 'Computer Science and Engineering',
    'Year of Study': '3rd Year',
    'State': 'Kerala',
    'District': 'Kannur',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'UPI/948291048192',
    'Registration Timestamp': '2026-10-02 13:14:28',
    'T-Shirt Size': 'L',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/gokul-krishna',
    'Prior Hackathon Experience': 'React & Next.js builder'
  },
  {
    'Participant ID': 'VB26-00012',
    'Full Name': 'Aparna Raj',
    'Email Address': 'aparna.raj@gcek.ac.in',
    'Phone Number': '9496123456',
    'College / Institution': 'Government College of Engineering Kannur',
    'Department / Branch': 'Computer Science and Engineering',
    'Year of Study': '3rd Year',
    'State': 'Kerala',
    'District': 'Kannur',
    'Payment Status': 'PENDING',
    'Transaction / UTR Reference': '',
    'Registration Timestamp': '2026-10-03 09:45:10',
    'T-Shirt Size': 'M',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/aparnaraj-dev',
    'Prior Hackathon Experience': 'UI/UX Designer & Frontend'
  },
  {
    'Participant ID': 'VB26-00013',
    'Full Name': 'Joel Mathew',
    'Email Address': 'joel.mathew@vjec.ac.in',
    'Phone Number': '9188123890',
    'College / Institution': 'Vimal Jyothi Engineering College, Chemperi',
    'Department / Branch': 'Computer Science and Engineering',
    'Year of Study': '4th Year',
    'State': 'Kerala',
    'District': 'Kannur',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'UPI/582910481928',
    'Registration Timestamp': '2026-10-03 14:50:33',
    'T-Shirt Size': 'XL',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/joelmathew-vjec',
    'Prior Hackathon Experience': 'Multiple hackathons, MERN stack'
  },
  {
    'Participant ID': 'VB26-00014',
    'Full Name': 'Sanjay P.',
    'Email Address': 'sanjay.p@cet.ac.in',
    'Phone Number': '9847987654',
    'College / Institution': 'College of Engineering Trivandrum',
    'Department / Branch': 'Computer Science and Engineering',
    'Year of Study': '3rd Year',
    'State': 'Kerala',
    'District': 'Thiruvananthapuram',
    'Payment Status': 'PAID',
    'Transaction / UTR Reference': 'UPI/729104819283',
    'Registration Timestamp': '2026-10-03 18:20:15',
    'T-Shirt Size': 'L',
    'Laptop Required': 'No',
    'GitHub Profile': 'https://github.com/sanjay-p-dev',
    'Prior Hackathon Experience': 'HackNITR finalist'
  },
  {
    'Participant ID': 'VB26-00015',
    'Full Name': 'Rohit K. V.',
    'Email Address': 'rohit.kv@vjec.ac.in',
    'Phone Number': '9446987123',
    'College / Institution': 'Vimal Jyothi Engineering College, Chemperi',
    'Department / Branch': 'Cyber Security',
    'Year of Study': '2nd Year',
    'State': 'Kerala',
    'District': 'Kannur',
    'Payment Status': 'PENDING',
    'Transaction / UTR Reference': '',
    'Registration Timestamp': '2026-10-04 11:30:00',
    'T-Shirt Size': 'L',
    'Laptop Required': 'Yes',
    'GitHub Profile': '',
    'Prior Hackathon Experience': 'Linux kernel & scripts'
  }
];

/**
 * Creates physical .xlsx and .csv files in data/ so they can be downloaded or imported
 */
export function generateSampleExcelFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const worksheet = XLSX.utils.json_to_sheet(INITIAL_REGISTRATION_DATA);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

  XLSX.writeFile(workbook, SAMPLE_EXCEL_PATH);
  
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  fs.writeFileSync(SAMPLE_CSV_PATH, csvContent, 'utf-8');
}

/**
 * Seeds the database directly with the initial Excel dataset if database is fresh
 */
export function seedInitialDatabaseIfNeeded() {
  // Ensure physical sample file exists for optional template download
  if (!fs.existsSync(SAMPLE_EXCEL_PATH)) {
    generateSampleExcelFiles();
  }
  // Keep database completely empty as requested by user.
}
