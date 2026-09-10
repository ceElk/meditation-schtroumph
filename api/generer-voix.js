// ---------------------------------------------------------------
// Fonction serverless Vercel.
// Convention Vercel : tout fichier dans /api/ devient automatiquement
// une route. Ce fichier repond aux requetes envoyees a /api/generer-voix
// -- aucune configuration supplementaire necessaire.
// ---------------------------------------------------------------

const LIMITE_CARACTERES = 300;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ erreur: "Méthode non autorisée. Utilise POST." });
    return;
  }

  const { texte } = req.body || {};

  if (!texte || typeof texte !== "string") {
    res.status(400).json({ erreur: 'Le champ "texte" est manquant.' });
    return;
  }

  const texteNettoye = texte.trim();

  if (texteNettoye.length === 0) {
    res.status(400).json({ erreur: "Le texte est vide." });
    return;
  }

  if (texteNettoye.length > LIMITE_CARACTERES) {
    res.status(400).json({
      erreur:
        "Texte trop long (" +
        texteNettoye.length +
        " caractères, " +
        LIMITE_CARACTERES +
        " max).",
    });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    res.status(500).json({
      erreur: "Configuration serveur incomplète (clé API ou voix manquante).",
    });
    return;
  }

  try {
    const options = {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        //Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: texteNettoye,
        model_id: "eleven_multilingual_v2",
        /*
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
        */
      }),
    };
    console.log("Envoi de la requête à ElevenLabs avec les options :", options);
    console.log("Texte voiceId :", voiceId);

    const reponseElevenLabs = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId,
      options
    );

    if (!reponseElevenLabs.ok) {
      const detail = await reponseElevenLabs.text();
      res.status(reponseElevenLabs.status).json({
        erreur: "ElevenLabs a refusé la demande.",
        details: detail,
      });
      return;
    }

    const audioBuffer = await reponseElevenLabs.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (erreur) {
    res
      .status(500)
      .json({ erreur: "Erreur serveur.", details: erreur.message });
  }
};
