// ---------------------------------------------------------------
// Ce formulaire ne valide jamais et n'envoie jamais rien nulle part.
// C'est volontaire : voir le cahier des charges, section formulaire
// de contact. Chaque tentative affiche un message different, dans
// un ordre progressif qui boucle a l'infini.
// ---------------------------------------------------------------
const messagesEchec = [
  "Mauvaise pioche.",
  "Tu es sûr ?",
  "Encore raté, allez, réessaie une dernière fois.",
  "Victoire !",
];

let tentative = 0;

const form = document.getElementById("contactForm");
const messageEl = document.getElementById("contactMessage");
const btn = document.getElementById("btnEnvoyer");

form.addEventListener("submit", function (e) {
  e.preventDefault(); // jamais de vrai envoi, jamais de rechargement de page

  const texte = messagesEchec[tentative % messagesEchec.length];
  const estVictoire =
    tentative % messagesEchec.length === messagesEchec.length - 1;

  messageEl.textContent = texte;
  messageEl.hidden = false;
  messageEl.classList.toggle("contact-message--victoire", estVictoire);

  if (estVictoire) {
    btn.textContent = "Recommencer";
  } else {
    btn.textContent = "Réessayer";
  }

  tentative++;
});
