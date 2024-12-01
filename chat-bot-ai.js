import dotenv from "dotenv"
import { Client } from "whatsapp-web.js"
import qrcode from "qrcode-terminal"
import { GoogleGenerativeAI } from "@google/generative-ai"

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-pro" })

const client = new Client()

// Predefined night-sky-related responses
const PREDEFINED_RESPONSES = {
  halo: "Halo! Saya adalah SkyBot, ahli tentang langit malam. Ada yang ingin kamu tahu tentang bintang atau fenomena luar angkasa?",
  "!ping": "Bzzzt... (Pong!) 🚀",
  "!help": `Selamat datang di SkyBot! 🌌
Berikut topik langit malam yang bisa kamu tanyakan:
- !stars : Informasi tentang bintang
- !planets : Planet di tata surya
- !galaxies : Galaksi di alam semesta
- !phenomena : Fenomena luar angkasa
- !telescopes : Cara menggunakan teleskop
- !events : Event astronomi terbaru

Kirim pertanyaan apapun tentang langit malam!`,
}

// Comprehensive Night Sky Prompt
const SKY_SYSTEM_PROMPT = `
Kamu adalah SkyBot, seorang ahli astronomi profesional dengan pengetahuan mendalam tentang:
- Bintang-bintang dan klasifikasinya
- Planet di tata surya dan exoplanet
- Galaksi, nebula, dan struktur besar alam semesta
- Fenomena luar angkasa seperti gerhana, supernova, dan hujan meteor
- Alat untuk mengamati langit seperti teleskop dan binokular
- Sejarah dan mitologi langit malam
- Cara memahami peta bintang
- Event astronomi terbaru dan penting

Karakteristik komunikasi:
- Gunakan bahasa Indonesia yang ramah
- Selalu panggil dengan "Kak"/ "Kakak" / "Sky Lovers" dan hindari memanggil dengan sebutan "Anda". 
- Jawab dengan detail tapi singkat (maks 3 paragraf)
- Tambahkan fakta menarik bila memungkinkan
- Gunakan nada bicara yang antusias tentang langit malam
- Jawab hanya yang kamu tahu saja
- Kamu juga dapat memberikan rekomendasi alat observasi jika mereka menanyakan teleskop atau binokular. Tanyakan dulu kebutuhan dan preferensi pengguna. Cocokkan dengan data yang kamu punya. Rekomendasikan setidaknya 3 alat observasi yang cocok.
- Hindari penggunaan emoticon berlebihan
`

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true })
  console.log("Scan QR Code untuk login WhatsApp")
})

client.on("ready", () => {
  console.log("SkyBot siap melayani pecinta langit malam! 🌌")
})

client.on("message", async (msg) => {
  // Ignore group messages
  if (msg.from.includes("@g.us")) return

  try {
    // Check for predefined responses first
    const lowercaseBody = msg.body.toLowerCase()
    for (let [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
      if (lowercaseBody === key.toLowerCase()) {
        await msg.reply(response)
        return
      }
    }

    // Special command for echo
    if (msg.body.startsWith("!echo ")) {
      await msg.reply(msg.body.slice(6))
      return
    }

    // Check for media
    if (msg.hasMedia) {
      await msg.reply("Maaf, saat ini saya hanya melayani pesan teks tentang langit malam.")
      return
    }

    // AI-powered response for night-sky-related queries
    const chat = model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 300 },
    })

    const prompt = `${SKY_SYSTEM_PROMPT}
Pertanyaan pengguna: ${msg.body}`

    const result = await chat.sendMessage(prompt)
    const response = await result.response
    const text = response.text()

    await msg.reply(text)
  } catch (error) {
    console.error("Error processing message:", error)
    await msg.reply("Maaf, ada gangguan. Coba tanya lagi tentang langit malam.")
  }
})

client.initialize()
