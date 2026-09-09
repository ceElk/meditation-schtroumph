// ---------------------------------------------------------------
// Visuels des cartes de méditation, mockés en JS en attendant les
// vraies illustrations. Pour brancher une vraie image plus tard :
// remplacer le bloc "el.style.background / el.textContent" ci-dessous
// par la création d'un <img src="images/[type]/cover.png">.
// ---------------------------------------------------------------
const visuelsMeditations = {
  "anti-stress": { icone: "🍃", couleur: "var(--accent-green)" },
  colere: { icone: "🔥", couleur: "var(--accent-red)" },
  sommeil: { icone: "😴", couleur: "var(--accent-brown)" },
  gratitude: { icone: "🙏", couleur: "var(--accent-green)" },
  "reseaux-sociaux": { icone: "📵", couleur: "var(--accent-red)" },
  erreur: { icone: "🙃", couleur: "var(--accent-brown)" },
  silence: { icone: "🤫", couleur: "var(--forest-deep)" },
};

document.querySelectorAll(".carte-visuel").forEach(function (el) {
  const config = visuelsMeditations[el.dataset.type];
  if (!config) return;
  el.style.background = config.couleur;
  el.textContent = config.icone;
});

// Si une vraie image existe pour ce type (images/[type]/cover.jpg), elle
// remplace la vignette colorée. Sinon, la vignette codee en JS ci-dessus
// reste affichee — aucune erreur, juste un repli silencieux.
document.querySelectorAll(".carte-image").forEach(function (img) {
  const visuel = img.parentElement.querySelector(
    '.carte-visuel[data-type="' + img.dataset.type + '"]'
  );
  img.onload = function () {
    img.hidden = false;
    if (visuel) visuel.hidden = true;
  };
  img.onerror = function () {
    img.hidden = true;
  };
});

// Son au survol de chaque carte de méditation
document.querySelectorAll(".carte").forEach(function (carte) {
  const src = carte.dataset.son;
  if (!src) return;

  let son;
  carte.addEventListener("mouseenter", function () {
    try {
      son = new Audio(src);
      son.volume = 0.5;
      son.play().catch(function () {
        // le fichier n'existe pas encore, ou l'autoplay est bloqué : on ignore silencieusement
      });
    } catch (e) {
      // pas de fichier audio pour l'instant, pas grave pour la démo
    }
  });
  carte.addEventListener("mouseleave", function () {
    if (son) son.pause();
  });
});

// Défilement doux vers les ancres internes
document.querySelectorAll('a[href^="#"]').forEach(function (lien) {
  lien.addEventListener("click", function (e) {
    const cible = document.querySelector(lien.getAttribute("href"));
    if (cible) {
      e.preventDefault();
      cible.scrollIntoView({ behavior: "smooth" });
    }
  });
});
