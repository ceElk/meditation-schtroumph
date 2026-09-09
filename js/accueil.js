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

// ---------------------------------------------------------------
// Ecran d'introduction : zoom dans le village + declenchement de
// la musique d'ambiance au clic sur "Entrer dans le village".
//
// Pourquoi un bouton et pas un lancement automatique ? Les
// navigateurs bloquent la lecture automatique du son tant qu'il n'y
// a pas eu d'interaction de la personne sur la page (regle de
// securite standard) -- le clic sur ce bouton sert justement de
// premiere interaction, ce qui autorise la musique a demarrer.
// ---------------------------------------------------------------
(function () {
  const overlay = document.getElementById("introOverlay");
  const visuel = document.getElementById("introVisual");
  const wash = document.getElementById("introWash");
  const btnEntrer = document.getElementById("btnEntrer");

  if (!overlay || !btnEntrer) return; // securite si ces elements n'existent pas sur une autre page

  const reduireAnimations = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  let musiqueAmbiance;

  function demarrerMusique() {
    try {
      musiqueAmbiance = new Audio("assets/audio/musique-fond-stroumph.mp3");
      musiqueAmbiance.loop = true;
      musiqueAmbiance.volume = 0.4;
      musiqueAmbiance.play().catch(function () {
        // fichier absent ou lecture bloquee : pas grave, le site reste utilisable sans musique
      });
    } catch (e) {
      // pas grave non plus
    }
  }

  btnEntrer.addEventListener("click", function () {
    btnEntrer.disabled = true;
    demarrerMusique();

    if (reduireAnimations) {
      // Personne ayant demande moins d'animations dans son systeme :
      // on saute direct a l'etape finale, sans zoom.
      overlay.classList.add("masque");
      return;
    }

    visuel.classList.add("zoom");
    wash.classList.add("cover");

    setTimeout(function () {
      overlay.classList.add("masque");
    }, 1600); // cale sur la duree de la transition CSS du zoom (1.7s)
  });
})();
