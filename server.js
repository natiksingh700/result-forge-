const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Serve static frontend files
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Initialize Neon PostgreSQL Connection Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initialize Database Tables
async function initDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                user_email TEXT NOT NULL,
                "studentName" TEXT,
                "classSection" TEXT,
                "fatherName" TEXT,
                "motherName" TEXT,
                address TEXT,
                dob TEXT,
                subjects TEXT,
                "resultData" TEXT
            )
        `);
        
        // Add resultData column if it doesn't exist (for older databases)
        await pool.query(`
            DO $$ BEGIN
                ALTER TABLE students ADD COLUMN IF NOT EXISTS "resultData" TEXT;
            EXCEPTION WHEN duplicate_column THEN NULL;
            END $$;
        `);

        // Create user_settings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                email TEXT PRIMARY KEY,
                logo_img TEXT,
                watermark_img TEXT,
                logo_settings TEXT,
                school_name TEXT,
                school_tagline TEXT,
                school_affiliation TEXT,
                school_board TEXT,
                result_theme TEXT,
                remove_logo_bg BOOLEAN
            )
        `);
        
        console.log('✅ Database tables initialized successfully');

        // Seed demo account unconditionally (create or update password to 'demo')
        const demoEmail = 'demo@school.com';
        const demoHash = await bcrypt.hash('demo', 10);
        
        await pool.query(
            `INSERT INTO users (email, password_hash) 
             VALUES ($1, $2)
             ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
            [demoEmail, demoHash]
        );
        console.log('✅ Demo account user created/updated with password "demo"');

        // Seed user settings for demo account if they don't exist
        await pool.query(
            `INSERT INTO user_settings (
                email, school_name, school_tagline, school_affiliation, school_board, result_theme, remove_logo_bg
             ) VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email) DO NOTHING`,
            [
                demoEmail,
                'Demo Public School',
                'Knowledge is Power',
                'Affiliated to C.B.S.E. New Delhi',
                'Affiliated to C.B.S.E. New Delhi',
                'theme-blue',
                false
            ]
        );

        // Seed dummy students for demo account if they don't exist
        const dummyStudents = [
            {
                id: 'demo-student-1',
                studentName: 'Aarav Sharma',
                classSection: '5TH',
                fatherName: 'Rajesh Sharma',
                motherName: 'Sunita Sharma',
                address: '123, Sector 4, Rohini, Delhi',
                dob: '15-08-2015',
                subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                resultData: JSON.stringify({
                    examName: "FINAL EXAM Marks Statement",
                    sessionYear: "2026-2027",
                    termName: "TERM II",
                    minMarksVal: 33,
                    subjectsData: "HINDI: 95 | ENGLISH: 88 | MATHEMATICS: 92 | ENVIRONMENTAL SCIENCE: 90 | COMPUTER: 85 | GENERAL KNOWLEDGE: 80 | ART and CRAFT: 90",
                    grandTotal: 620,
                    maxTotalMarks: 700,
                    percentage: "88.57",
                    overallGrade: "A2",
                    cgpa: "9.0",
                    resultStatus: "Passed",
                    autoRemark: "Excellent performance.",
                    reopenDate: "18th MARCH, 2024",
                    coScholasticData: "A+|A+|A+|A"
                })
            },
            {
                id: 'demo-student-2',
                studentName: 'Ananya Verma',
                classSection: '5TH',
                fatherName: 'Sanjay Verma',
                motherName: 'Kiran Verma',
                address: '456, Pocket C, Dwarka, Delhi',
                dob: '22-11-2015',
                subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                resultData: JSON.stringify({
                    examName: "FINAL EXAM Marks Statement",
                    sessionYear: "2026-2027",
                    termName: "TERM II",
                    minMarksVal: 33,
                    subjectsData: "HINDI: 82 | ENGLISH: 78 | MATHEMATICS: 65 | ENVIRONMENTAL SCIENCE: 74 | COMPUTER: 88 | GENERAL KNOWLEDGE: 85 | ART and CRAFT: 80",
                    grandTotal: 552,
                    maxTotalMarks: 700,
                    percentage: "78.86",
                    overallGrade: "B1",
                    cgpa: "8.0",
                    resultStatus: "Passed",
                    autoRemark: "Very good performance.",
                    reopenDate: "18th MARCH, 2024",
                    coScholasticData: "A|A|A+|A"
                })
            },
            {
                id: 'demo-student-3',
                studentName: 'Vihaan Patel',
                classSection: '5TH',
                fatherName: 'Deepak Patel',
                motherName: 'Meena Patel',
                address: '789, Navrangpura, Ahmedabad',
                dob: '05-04-2015',
                subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                resultData: JSON.stringify({
                    examName: "FINAL EXAM Marks Statement",
                    sessionYear: "2026-2027",
                    termName: "TERM II",
                    minMarksVal: 33,
                    subjectsData: "HINDI: 74 | ENGLISH: 80 | MATHEMATICS: 88 | ENVIRONMENTAL SCIENCE: 82 | COMPUTER: 90 | GENERAL KNOWLEDGE: 76 | ART and CRAFT: 85",
                    grandTotal: 575,
                    maxTotalMarks: 700,
                    percentage: "82.14",
                    overallGrade: "A2",
                    cgpa: "8.7",
                    resultStatus: "Passed",
                    autoRemark: "Very good progress.",
                    reopenDate: "18th MARCH, 2024",
                    coScholasticData: "A|A+|A|A"
                })
            },
            {
                id: 'demo-student-4',
                studentName: 'Diya Iyer',
                classSection: '5TH',
                fatherName: 'Ramakrishnan Iyer',
                motherName: 'Lakshmi Iyer',
                address: '12, Mylapore, Chennai',
                dob: '10-09-2015',
                subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                resultData: JSON.stringify({
                    examName: "FINAL EXAM Marks Statement",
                    sessionYear: "2026-2027",
                    termName: "TERM II",
                    minMarksVal: 33,
                    subjectsData: "HINDI: 90 | ENGLISH: 96 | MATHEMATICS: 95 | ENVIRONMENTAL SCIENCE: 92 | COMPUTER: 98 | GENERAL KNOWLEDGE: 94 | ART and CRAFT: 88",
                    grandTotal: 653,
                    maxTotalMarks: 700,
                    percentage: "93.29",
                    overallGrade: "A1",
                    cgpa: "9.8",
                    resultStatus: "Passed",
                    autoRemark: "Outstanding academic performance!",
                    reopenDate: "18th MARCH, 2024",
                    coScholasticData: "A+|A+|A+|A+"
                })
            },
            {
                id: 'demo-student-5',
                studentName: 'Sai Reddy',
                classSection: '5TH',
                fatherName: 'Venkat Reddy',
                motherName: 'Latha Reddy',
                address: '56, Gachibowli, Hyderabad',
                dob: '12-01-2015',
                subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                resultData: JSON.stringify({
                    examName: "FINAL EXAM Marks Statement",
                    sessionYear: "2026-2027",
                    termName: "TERM II",
                    minMarksVal: 33,
                    subjectsData: "HINDI: 65 | ENGLISH: 72 | MATHEMATICS: 58 | ENVIRONMENTAL SCIENCE: 64 | COMPUTER: 70 | GENERAL KNOWLEDGE: 68 | ART and CRAFT: 75",
                    grandTotal: 467,
                    maxTotalMarks: 700,
                    percentage: "66.71",
                    overallGrade: "B2",
                    cgpa: "7.0",
                    resultStatus: "Passed",
                    autoRemark: "Good effort. Can improve more.",
                    reopenDate: "18th MARCH, 2024",
                    coScholasticData: "B|B|A|B"
                })
            },
            {
                id: 'demo-student-6',
                studentName: 'Ishaan Nair',
                classSection: '5TH',
                fatherName: 'Madhavan Nair',
                motherName: 'Radha Nair',
                address: '101, Kadavanthra, Kochi',
                dob: '30-06-2015',
                subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                resultData: JSON.stringify({
                    examName: "FINAL EXAM Marks Statement",
                    sessionYear: "2026-2027",
                    termName: "TERM II",
                    minMarksVal: 33,
                    subjectsData: "HINDI: 80 | ENGLISH: 85 | MATHEMATICS: 78 | ENVIRONMENTAL SCIENCE: 84 | COMPUTER: 82 | GENERAL KNOWLEDGE: 80 | ART and CRAFT: 85",
                    grandTotal: 574,
                    maxTotalMarks: 700,
                    percentage: "82.00",
                    overallGrade: "A2",
                    cgpa: "8.7",
                    resultStatus: "Passed",
                    autoRemark: "Consistent and active learner.",
                    reopenDate: "18th MARCH, 2024",
                    coScholasticData: "A|A|A|A"
                })
            },
            {
                id: 'demo-student-7',
                studentName: 'Kabir Gupta',
                classSection: '5TH',
                fatherName: 'Amit Gupta',
                motherName: 'Ritu Gupta',
                address: '88, Salt Lake, Kolkata',
                dob: '18-03-2015',
                subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                resultData: JSON.stringify({
                    examName: "FINAL EXAM Marks Statement",
                    sessionYear: "2026-2027",
                    termName: "TERM II",
                    minMarksVal: 33,
                    subjectsData: "HINDI: 48 | ENGLISH: 52 | MATHEMATICS: 45 | ENVIRONMENTAL SCIENCE: 50 | COMPUTER: 55 | GENERAL KNOWLEDGE: 42 | ART and CRAFT: 60",
                    grandTotal: 352,
                    maxTotalMarks: 700,
                    percentage: "50.29",
                    overallGrade: "C2",
                    cgpa: "5.5",
                    resultStatus: "Passed",
                    autoRemark: "Needs to pay more attention in class.",
                    reopenDate: "18th MARCH, 2024",
                    coScholasticData: "B|C|B|B"
                })
            },
            {
                id: 'demo-student-8',
                studentName: 'Tanya Sen',
                classSection: '5TH',
                fatherName: 'Joydeep Sen',
                motherName: 'Mousumi Sen',
                address: '9, Ballygunge, Kolkata',
                dob: '25-10-2015',
                subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                resultData: JSON.stringify({
                    examName: "FINAL EXAM Marks Statement",
                    sessionYear: "2026-2027",
                    termName: "TERM II",
                    minMarksVal: 33,
                    subjectsData: "HINDI: 88 | ENGLISH: 92 | MATHEMATICS: 90 | ENVIRONMENTAL SCIENCE: 86 | COMPUTER: 94 | GENERAL KNOWLEDGE: 88 | ART and CRAFT: 92",
                    grandTotal: 630,
                    maxTotalMarks: 700,
                    percentage: "90.00",
                    overallGrade: "A1",
                    cgpa: "9.5",
                    resultStatus: "Passed",
                    autoRemark: "Excellent academic performance.",
                    reopenDate: "18th MARCH, 2024",
                    coScholasticData: "A+|A|A+|A+"
                })
            },
            {
                id: 'demo-student-9',
                studentName: 'Arjun Rao',
                classSection: '5TH',
                fatherName: 'Prasanna Rao',
                motherName: 'Gayatri Rao',
                address: '45, Indiranagar, Bengaluru',
                dob: '02-12-2015',
                subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                resultData: JSON.stringify({
                    examName: "FINAL EXAM Marks Statement",
                    sessionYear: "2026-2027",
                    termName: "TERM II",
                    minMarksVal: 33,
                    subjectsData: "HINDI: 55 | ENGLISH: 60 | MATHEMATICS: 52 | ENVIRONMENTAL SCIENCE: 58 | COMPUTER: 62 | GENERAL KNOWLEDGE: 50 | ART and CRAFT: 65",
                    grandTotal: 402,
                    maxTotalMarks: 700,
                    percentage: "57.43",
                    overallGrade: "C1",
                    cgpa: "6.0",
                    resultStatus: "Passed",
                    autoRemark: "Needs hard work in core subjects.",
                    reopenDate: "18th MARCH, 2024",
                    coScholasticData: "B|B|B|B"
                })
            },
            {
                id: 'demo-student-10',
                studentName: 'Meera Joshi',
                classSection: '5TH',
                fatherName: 'Harish Joshi',
                motherName: 'Alka Joshi',
                address: '102, Kothrud, Pune',
                dob: '14-07-2015',
                subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                resultData: JSON.stringify({
                    examName: "FINAL EXAM Marks Statement",
                    sessionYear: "2026-2027",
                    termName: "TERM II",
                    minMarksVal: 33,
                    subjectsData: "HINDI: 92 | ENGLISH: 88 | MATHEMATICS: 96 | ENVIRONMENTAL SCIENCE: 94 | COMPUTER: 90 | GENERAL KNOWLEDGE: 86 | ART and CRAFT: 92",
                    grandTotal: 638,
                    maxTotalMarks: 700,
                    percentage: "91.14",
                    overallGrade: "A1",
                    cgpa: "9.6",
                    resultStatus: "Passed",
                    autoRemark: "Brilliant performance in all subjects.",
                    reopenDate: "18th MARCH, 2024",
                    coScholasticData: "A+|A+|A+|A+"
                })
            }
        ];

        // Clear any old/custom demo students that are not the official ones
        await pool.query(
            `DELETE FROM students WHERE user_email = $1 AND id NOT LIKE 'demo-student-%'`,
            [demoEmail]
        );

        for (const s of dummyStudents) {
            await pool.query(
                `INSERT INTO students (id, user_email, "studentName", "classSection", "fatherName", "motherName", address, dob, subjects, "resultData") 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [s.id, demoEmail, s.studentName, s.classSection, s.fatherName, s.motherName, s.address, s.dob, s.subjects, s.resultData]
            );
        }
        console.log('✅ Demo account check and seeding completed');
    } catch (err) {
        console.error('❌ Database initialization error:', err.message);
    }
}

initDb();

// Configure Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'YOUR_EMAIL@gmail.com',
        pass: process.env.SMTP_PASS || 'YOUR_APP_PASSWORD'
    }
});


// ---------------- AUTHENTICATION ENDPOINTS ---------------- //

app.post('/api/auth/signup', async (req, res) => {
    const { email, pass, inviteCode } = req.body;
    if(!email || !pass) return res.status(400).json({ error: "Email and password required" });
    
    // Check invite code
    const requiredCode = process.env.SIGNUP_CODE;
    if (!requiredCode || inviteCode !== requiredCode) {
        return res.status(403).json({ error: "Invalid Invite/Access Code! You cannot create an account directly. Please use the Demo account or contact the admin for a valid code." });
    }
    
    try {
        const hash = await bcrypt.hash(pass, 10);
        await pool.query(
            `INSERT INTO users (email, password_hash) VALUES ($1, $2)`,
            [email, hash]
        );
        res.json({ message: "Signup successful" });
    } catch(err) {
        if (err.code === '23505') { // PostgreSQL unique violation
            return res.status(400).json({ error: "Email already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, pass } = req.body;
    
    try {
        const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
        const user = result.rows[0];
        
        if (!user) return res.status(400).json({ error: "Invalid email or password" });
        
        const match = await bcrypt.compare(pass, user.password_hash);
        if (match) {
            res.json({ message: "Login successful", email: user.email });
        } else {
            res.status(400).json({ error: "Invalid email or password" });
        }
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    try {
        const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
        const user = result.rows[0];
        
        if (!user) return res.status(404).json({ error: "No account found with this email address." });
        
        // Generate secure reset token
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour se expire
        
        // Save token in database
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL,
                token TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE
            )
        `);
        
        // Delete old tokens for this email
        await pool.query(`DELETE FROM password_resets WHERE email = $1`, [email]);
        
        // Insert new token
        await pool.query(
            `INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)`,
            [email, token, expiresAt]
        );
        
        // Build reset link
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const resetLink = `${baseUrl}/reset-password.html?token=${token}`;
        
        const mailOptions = {
            from: process.env.SMTP_USER || 'schooladmin@gmail.com',
            to: email,
            subject: '🔐 Result Forge - Password Reset',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1e293b; color: #e2e8f0; padding: 30px; border-radius: 12px;">
                    <h1 style="color: #f97316; text-align: center; margin-bottom: 10px;">Result<span style="color: #38bdf8;">Forge</span></h1>
                    <h2 style="text-align: center; color: #e2e8f0; font-size: 18px;">Password Reset Request</h2>
                    <p style="color: #94a3b8; text-align: center;">You requested a password reset. Click the button below to set your new password:</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="${resetLink}" style="background: #f97316; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">🔑 Set New Password</a>
                    </div>
                    <p style="color: #64748b; font-size: 13px; text-align: center;">This link will expire in <strong>1 hour</strong>.</p>
                    <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">If you did not request this, please ignore this email.</p>
                </div>
            `
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email Error:", error);
                return res.json({ message: "Error sending email. Please check server logs.", resetLink: resetLink });
            }
            res.json({ message: "A password reset link has been sent to your email address! Please check your inbox." });
        });
    } catch(err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Reset Password - verify token & update password
app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are both required." });
    }
    
    if (newPassword.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters long." });
    }
    
    try {
        // Find valid token
        const result = await pool.query(
            `SELECT * FROM password_resets WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
            [token]
        );
        
        const resetRecord = result.rows[0];
        
        if (!resetRecord) {
            return res.status(400).json({ error: "This link has expired or has already been used. Please request a new password reset." });
        }
        
        // Hash new password
        const hash = await bcrypt.hash(newPassword, 10);
        
        // Update user password
        await pool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hash, resetRecord.email]);
        
        // Mark token as used
        await pool.query(`UPDATE password_resets SET used = TRUE WHERE token = $1`, [token]);
        
        res.json({ message: "Password changed successfully! You can now log in with your new password." });
    } catch(err) {
        console.error("Reset password error:", err);
        res.status(500).json({ error: err.message });
    }
});



// ---------------- USER SETTINGS ENDPOINTS ---------------- //

app.get('/api/settings', async (req, res) => {
    const { email } = req.query;
    if(!email) return res.status(400).json({ error: "Email required" });
    
    try {
        const result = await pool.query(
            `SELECT * FROM user_settings WHERE email = $1`,
            [email]
        );
        if (result.rows.length === 0) {
            return res.json({});
        }
        res.json(result.rows[0]);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    const { 
        email, 
        logo_img, 
        watermark_img, 
        logo_settings, 
        school_name, 
        school_tagline, 
        school_affiliation, 
        school_board, 
        result_theme, 
        remove_logo_bg 
    } = req.body;
    
    if(!email) return res.status(400).json({ error: "Email required" });
    
    try {
        await pool.query(
            `INSERT INTO user_settings (
                email, logo_img, watermark_img, logo_settings, 
                school_name, school_tagline, school_affiliation, 
                school_board, result_theme, remove_logo_bg
             ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (email) DO UPDATE SET 
                logo_img = $2,
                watermark_img = $3,
                logo_settings = $4,
                school_name = $5,
                school_tagline = $6,
                school_affiliation = $7,
                school_board = $8,
                result_theme = $9,
                remove_logo_bg = $10`,
            [
                email, logo_img, watermark_img, logo_settings, 
                school_name, school_tagline, school_affiliation, 
                school_board, result_theme, remove_logo_bg
            ]
        );
        res.json({ message: "Settings saved successfully" });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});



// ---------------- STUDENTS ENDPOINTS ---------------- //

app.get('/api/students', async (req, res) => {
    const user_email = req.query.email;
    if(!user_email) return res.status(400).json({ error: "Email required" });
    
    try {
        let result = await pool.query(
            `SELECT * FROM students WHERE user_email = $1`,
            [user_email]
        );
        
        // Self-healing: If demo account has 0 students, seed/restore the 10 demo students automatically
        if (user_email === 'demo@school.com' && result.rows.length === 0) {
            const dummyStudents = [
                {
                    id: 'demo-student-1',
                    studentName: 'Aarav Sharma',
                    classSection: '5TH',
                    fatherName: 'Rajesh Sharma',
                    motherName: 'Sunita Sharma',
                    address: '123, Sector 4, Rohini, Delhi',
                    dob: '15-08-2015',
                    subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                    resultData: JSON.stringify({
                        examName: "FINAL EXAM Marks Statement",
                        sessionYear: "2026-2027",
                        termName: "TERM II",
                        minMarksVal: 33,
                        subjectsData: "HINDI: 95 | ENGLISH: 88 | MATHEMATICS: 92 | ENVIRONMENTAL SCIENCE: 90 | COMPUTER: 85 | GENERAL KNOWLEDGE: 80 | ART and CRAFT: 90",
                        grandTotal: 620,
                        maxTotalMarks: 700,
                        percentage: "88.57",
                        overallGrade: "A2",
                        cgpa: "9.0",
                        resultStatus: "Passed",
                        autoRemark: "Excellent performance.",
                        reopenDate: "18th MARCH, 2024",
                        coScholasticData: "A+|A+|A+|A"
                    })
                },
                {
                    id: 'demo-student-2',
                    studentName: 'Ananya Verma',
                    classSection: '5TH',
                    fatherName: 'Sanjay Verma',
                    motherName: 'Kiran Verma',
                    address: '456, Pocket C, Dwarka, Delhi',
                    dob: '22-11-2015',
                    subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                    resultData: JSON.stringify({
                        examName: "FINAL EXAM Marks Statement",
                        sessionYear: "2026-2027",
                        termName: "TERM II",
                        minMarksVal: 33,
                        subjectsData: "HINDI: 82 | ENGLISH: 78 | MATHEMATICS: 65 | ENVIRONMENTAL SCIENCE: 74 | COMPUTER: 88 | GENERAL KNOWLEDGE: 85 | ART and CRAFT: 80",
                        grandTotal: 552,
                        maxTotalMarks: 700,
                        percentage: "78.86",
                        overallGrade: "B1",
                        cgpa: "8.0",
                        resultStatus: "Passed",
                        autoRemark: "Very good performance.",
                        reopenDate: "18th MARCH, 2024",
                        coScholasticData: "A|A|A+|A"
                    })
                },
                {
                    id: 'demo-student-3',
                    studentName: 'Vihaan Patel',
                    classSection: '5TH',
                    fatherName: 'Deepak Patel',
                    motherName: 'Meena Patel',
                    address: '789, Navrangpura, Ahmedabad',
                    dob: '05-04-2015',
                    subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                    resultData: JSON.stringify({
                        examName: "FINAL EXAM Marks Statement",
                        sessionYear: "2026-2027",
                        termName: "TERM II",
                        minMarksVal: 33,
                        subjectsData: "HINDI: 74 | ENGLISH: 80 | MATHEMATICS: 88 | ENVIRONMENTAL SCIENCE: 82 | COMPUTER: 90 | GENERAL KNOWLEDGE: 76 | ART and CRAFT: 85",
                        grandTotal: 575,
                        maxTotalMarks: 700,
                        percentage: "82.14",
                        overallGrade: "A2",
                        cgpa: "8.7",
                        resultStatus: "Passed",
                        autoRemark: "Very good progress.",
                        reopenDate: "18th MARCH, 2024",
                        coScholasticData: "A|A+|A|A"
                    })
                },
                {
                    id: 'demo-student-4',
                    studentName: 'Diya Iyer',
                    classSection: '5TH',
                    fatherName: 'Ramakrishnan Iyer',
                    motherName: 'Lakshmi Iyer',
                    address: '12, Mylapore, Chennai',
                    dob: '10-09-2015',
                    subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                    resultData: JSON.stringify({
                        examName: "FINAL EXAM Marks Statement",
                        sessionYear: "2026-2027",
                        termName: "TERM II",
                        minMarksVal: 33,
                        subjectsData: "HINDI: 90 | ENGLISH: 96 | MATHEMATICS: 95 | ENVIRONMENTAL SCIENCE: 92 | COMPUTER: 98 | GENERAL KNOWLEDGE: 94 | ART and CRAFT: 88",
                        grandTotal: 653,
                        maxTotalMarks: 700,
                        percentage: "93.29",
                        overallGrade: "A1",
                        cgpa: "9.8",
                        resultStatus: "Passed",
                        autoRemark: "Outstanding academic performance!",
                        reopenDate: "18th MARCH, 2024",
                        coScholasticData: "A+|A+|A+|A+"
                })
                },
                {
                    id: 'demo-student-5',
                    studentName: 'Sai Reddy',
                    classSection: '5TH',
                    fatherName: 'Venkat Reddy',
                    motherName: 'Latha Reddy',
                    address: '56, Gachibowli, Hyderabad',
                    dob: '12-01-2015',
                    subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                    resultData: JSON.stringify({
                        examName: "FINAL EXAM Marks Statement",
                        sessionYear: "2026-2027",
                        termName: "TERM II",
                        minMarksVal: 33,
                        subjectsData: "HINDI: 65 | ENGLISH: 72 | MATHEMATICS: 58 | ENVIRONMENTAL SCIENCE: 64 | COMPUTER: 70 | GENERAL KNOWLEDGE: 68 | ART and CRAFT: 75",
                        grandTotal: 467,
                        maxTotalMarks: 700,
                        percentage: "66.71",
                        overallGrade: "B2",
                        cgpa: "7.0",
                        resultStatus: "Passed",
                        autoRemark: "Good effort. Can improve more.",
                        reopenDate: "18th MARCH, 2024",
                        coScholasticData: "B|B|A|B"
                    })
                },
                {
                    id: 'demo-student-6',
                    studentName: 'Ishaan Nair',
                    classSection: '5TH',
                    fatherName: 'Madhavan Nair',
                    motherName: 'Radha Nair',
                    address: '101, Kadavanthra, Kochi',
                    dob: '30-06-2015',
                    subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                    resultData: JSON.stringify({
                        examName: "FINAL EXAM Marks Statement",
                        sessionYear: "2026-2027",
                        termName: "TERM II",
                        minMarksVal: 33,
                        subjectsData: "HINDI: 80 | ENGLISH: 85 | MATHEMATICS: 78 | ENVIRONMENTAL SCIENCE: 84 | COMPUTER: 82 | GENERAL KNOWLEDGE: 80 | ART and CRAFT: 85",
                        grandTotal: 574,
                        maxTotalMarks: 700,
                        percentage: "82.00",
                        overallGrade: "A2",
                        cgpa: "8.7",
                        resultStatus: "Passed",
                        autoRemark: "Consistent and active learner.",
                        reopenDate: "18th MARCH, 2024",
                        coScholasticData: "A|A|A|A"
                    })
                },
                {
                    id: 'demo-student-7',
                    studentName: 'Kabir Gupta',
                    classSection: '5TH',
                    fatherName: 'Amit Gupta',
                    motherName: 'Ritu Gupta',
                    address: '88, Salt Lake, Kolkata',
                    dob: '18-03-2015',
                    subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                    resultData: JSON.stringify({
                        examName: "FINAL EXAM Marks Statement",
                        sessionYear: "2026-2027",
                        termName: "TERM II",
                        minMarksVal: 33,
                        subjectsData: "HINDI: 48 | ENGLISH: 52 | MATHEMATICS: 45 | ENVIRONMENTAL SCIENCE: 50 | COMPUTER: 55 | GENERAL KNOWLEDGE: 42 | ART and CRAFT: 60",
                        grandTotal: 352,
                        maxTotalMarks: 700,
                        percentage: "50.29",
                        overallGrade: "C2",
                        cgpa: "5.5",
                        resultStatus: "Passed",
                        autoRemark: "Needs to pay more attention in class.",
                        reopenDate: "18th MARCH, 2024",
                        coScholasticData: "B|C|B|B"
                    })
                },
                {
                    id: 'demo-student-8',
                    studentName: 'Tanya Sen',
                    classSection: '5TH',
                    fatherName: 'Joydeep Sen',
                    motherName: 'Mousumi Sen',
                    address: '9, Ballygunge, Kolkata',
                    dob: '25-10-2015',
                    subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                    resultData: JSON.stringify({
                        examName: "FINAL EXAM Marks Statement",
                        sessionYear: "2026-2027",
                        termName: "TERM II",
                        minMarksVal: 33,
                        subjectsData: "HINDI: 88 | ENGLISH: 92 | MATHEMATICS: 90 | ENVIRONMENTAL SCIENCE: 86 | COMPUTER: 94 | GENERAL KNOWLEDGE: 88 | ART and CRAFT: 92",
                        grandTotal: 630,
                        maxTotalMarks: 700,
                        percentage: "90.00",
                        overallGrade: "A1",
                        cgpa: "9.5",
                        resultStatus: "Passed",
                        autoRemark: "Excellent academic performance.",
                        reopenDate: "18th MARCH, 2024",
                        coScholasticData: "A+|A|A+|A+"
                    })
                },
                {
                    id: 'demo-student-9',
                    studentName: 'Arjun Rao',
                    classSection: '5TH',
                    fatherName: 'Prasanna Rao',
                    motherName: 'Gayatri Rao',
                    address: '45, Indiranagar, Bengaluru',
                    dob: '02-12-2015',
                    subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                    resultData: JSON.stringify({
                        examName: "FINAL EXAM Marks Statement",
                        sessionYear: "2026-2027",
                        termName: "TERM II",
                        minMarksVal: 33,
                        subjectsData: "HINDI: 55 | ENGLISH: 60 | MATHEMATICS: 52 | ENVIRONMENTAL SCIENCE: 58 | COMPUTER: 62 | GENERAL KNOWLEDGE: 50 | ART and CRAFT: 65",
                        grandTotal: 402,
                        maxTotalMarks: 700,
                        percentage: "57.43",
                        overallGrade: "C1",
                        cgpa: "6.0",
                        resultStatus: "Passed",
                        autoRemark: "Needs hard work in core subjects.",
                        reopenDate: "18th MARCH, 2024",
                        coScholasticData: "B|B|B|B"
                    })
                },
                {
                    id: 'demo-student-10',
                    studentName: 'Meera Joshi',
                    classSection: '5TH',
                    fatherName: 'Harish Joshi',
                    motherName: 'Alka Joshi',
                    address: '102, Kothrud, Pune',
                    dob: '14-07-2015',
                    subjects: JSON.stringify(['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT']),
                    resultData: JSON.stringify({
                        examName: "FINAL EXAM Marks Statement",
                        sessionYear: "2026-2027",
                        termName: "TERM II",
                        minMarksVal: 33,
                        subjectsData: "HINDI: 92 | ENGLISH: 88 | MATHEMATICS: 96 | ENVIRONMENTAL SCIENCE: 94 | COMPUTER: 90 | GENERAL KNOWLEDGE: 86 | ART and CRAFT: 92",
                        grandTotal: 638,
                        maxTotalMarks: 700,
                        percentage: "91.14",
                        overallGrade: "A1",
                        cgpa: "9.6",
                        resultStatus: "Passed",
                        autoRemark: "Brilliant performance in all subjects.",
                        reopenDate: "18th MARCH, 2024",
                        coScholasticData: "A+|A+|A+|A+"
                    })
                }
            ];

            for (const s of dummyStudents) {
                await pool.query(
                    `INSERT INTO students (id, user_email, "studentName", "classSection", "fatherName", "motherName", address, dob, subjects, "resultData") 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                     ON CONFLICT (id) DO NOTHING`,
                    [s.id, user_email, s.studentName, s.classSection, s.fatherName, s.motherName, s.address, s.dob, s.subjects, s.resultData]
                );
            }

            // Re-fetch
            result = await pool.query(
                `SELECT * FROM students WHERE user_email = $1`,
                [user_email]
            );
        }

        const students = result.rows.map(r => {
            const parsedResultData = r.resultData ? JSON.parse(r.resultData) : {};
            return {
                ...r,
                subjects: JSON.parse(r.subjects || '[]'),
                ...parsedResultData
            };
        });
        res.json(students);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/students', async (req, res) => {
    const { user_email, students } = req.body;
    if(!user_email || !students) return res.status(400).json({ error: "Email and students data required" });
    
    // Validate demo account limits
    if (user_email === 'demo@school.com') {
        // Check current count in DB
        const existing = await pool.query(`SELECT COUNT(*) FROM students WHERE user_email = $1`, [user_email]);
        const currentCount = parseInt(existing.rows[0].count);
        
        // If already 10 students, block any changes (no add, no delete)
        if (currentCount >= 10) {
            return res.status(400).json({ error: "🚫 Demo account has reached the 10 student limit! You cannot add or delete students once the limit is reached. Please Sign Up for unlimited access." });
        }
        
        // If trying to add more than 10
        if (students.length > 10) {
            return res.status(400).json({ error: "🚫 Demo account allows a maximum of 10 students only. Please Sign Up for unlimited students." });
        }
    }
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Delete existing students for this user
        await client.query(`DELETE FROM students WHERE user_email = $1`, [user_email]);
        
        // Insert all students
        for (const s of students) {
            const { id, user_email: ue, studentName, classSection, fatherName, motherName, address, dob, subjects, ...resultData } = s;
            await client.query(
                `INSERT INTO students (id, user_email, "studentName", "classSection", "fatherName", "motherName", address, dob, subjects, "resultData") 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [s.id, user_email, s.studentName, s.classSection, s.fatherName, s.motherName, s.address, s.dob, JSON.stringify(s.subjects || []), JSON.stringify(resultData)]
            );
        }
        
        await client.query('COMMIT');
        res.json({ message: "Database saved successfully" });
    } catch(err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ---------------- DATA MIGRATION ENDPOINT ---------------- //
app.post('/api/migrate', async (req, res) => {
    const { email, students } = req.body;
    if(!email || !students || students.length === 0) return res.json({ message: "No data to migrate" });
    
    // Block migration for demo account
    if (email === 'demo@school.com') {
        return res.status(403).json({ error: "Migration is disabled for the Demo account. Please sign up to import your own data." });
    }
    
    try {
        for (const s of students) {
            const { id, user_email: ue, studentName, classSection, fatherName, motherName, address, dob, subjects, ...resultData } = s;
            await pool.query(
                `INSERT INTO students (id, user_email, "studentName", "classSection", "fatherName", "motherName", address, dob, subjects, "resultData") 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [s.id, email, s.studentName, s.classSection, s.fatherName, s.motherName, s.address, s.dob, JSON.stringify(s.subjects || []), JSON.stringify(resultData)]
            );
        }
        res.json({ message: "Migration completed" });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`To access the app, open http://localhost:${PORT} in your browser.`);
});
