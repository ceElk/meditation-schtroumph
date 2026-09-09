// ---------------------------------------------------------------
// Liste des types de méditation pour le fil de navigation.
// À terme, un fichier JSON existera pour chacun (data/[type].json) ;
// tant qu'un type n'a pas son fichier, sa page affiche un message
// d'erreur propre plutôt qu'un plantage silencieux.
// ---------------------------------------------------------------
const TYPES_MEDITATION = [
  { id: "anti-stress", label: "Anti-stress" },
  { id: "colere", label: "Colère" },
  { id: "sommeil", label: "Sommeil" },
  { id: "gratitude", label: "Gratitude" },
  { id: "reseaux-sociaux", label: "Lâcher-prise" },
  { id: "erreur", label: "Guidée par erreur" },
  { id: "silence", label: "Silence total" },
];

function typeDepuisURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("type") || "colere";
}

function construireNavigation(typeActuel) {
  const nav = document.getElementById("meditationSwitch");
  TYPES_MEDITATION.forEach(function (t) {
    const lien = document.createElement("a");
    lien.href = "meditation.html?type=" + t.id;
    lien.textContent = t.label;
    lien.className =
      "meditation-switch-item" + (t.id === typeActuel ? " actif" : "");
    nav.appendChild(lien);
  });
}

function afficherErreur() {
  document.getElementById("meditationIntro").hidden = true;
  document.getElementById("cercleRespiration").hidden = true;
  document.getElementById("etatRespiration").hidden = true;
  document.getElementById("bulleMeditation").hidden = true;
  document.querySelector(".meditation-controles").hidden = true;
  document.getElementById("meditationErreur").hidden = false;
}

function definirVisuel(etape) {
  const img = document.getElementById("mascotImage");
  const mascotCss = document.getElementById("mascotWrap");

  if (!etape.image) {
    img.hidden = true;
    mascotCss.hidden = false;
    definirHumeur(etape.humeur);
    return;
  }

  // On tente de charger la vraie image. Si elle n'existe pas encore
  // (fichier manquant), on se replie automatiquement sur le personnage
  // dessiné en CSS, avec la meme humeur.
  img.onload = function () {
    img.hidden = false;
    mascotCss.hidden = true;
  };
  img.onerror = function () {
    img.hidden = true;
    mascotCss.hidden = false;
    definirHumeur(etape.humeur);
  };
  img.alt = etape.humeur;
  img.src = etape.image;
}

function definirHumeur(humeur) {
  const mascot = document.getElementById("mascotWrap");
  mascot.className = "mascot-wrap mood-" + humeur;
}

// ---------------------------------------------------------------
// Fond d'ecran : deux calques superposes pour pouvoir faire un
// fondu enchaine entre l'ancien et le nouveau fond. Si le fichier
// image n'existe pas encore, repli sur un degrade de couleur propre
// a l'humeur (bg-zen / bg-enerve / bg-tres-enerve / bg-grincheux).
// ---------------------------------------------------------------
let calqueActif = "A";

function definirFond(etape) {
  const calques = {
    A: document.getElementById("bgLayerA"),
    B: document.getElementById("bgLayerB"),
  };
  const ancien = calques[calqueActif];
  const nouveauKey = calqueActif === "A" ? "B" : "A";
  const nouveau = calques[nouveauKey];

  function basculer() {
    nouveau.classList.add("visible");
    ancien.classList.remove("visible");
    calqueActif = nouveauKey;
  }

  // reinitialise le calque qui va recevoir le nouveau fond
  nouveau.className = "meditation-bg-layer";
  nouveau.style.backgroundImage = "";

  if (!etape.fond) {
    nouveau.classList.add("bg-" + etape.humeur);
    basculer();
    return;
  }

  const test = new Image();
  test.onload = function () {
    nouveau.style.backgroundImage = "url('" + etape.fond + "')";
    basculer();
  };
  test.onerror = function () {
    nouveau.classList.add("bg-" + etape.humeur);
    basculer();
  };
  test.src = etape.fond;
}

function jouerSon(chemin) {
  try {
    const son = new Audio(chemin);
    son.volume = 0.6;
    son.play().catch(function () {
      /* pas grave si le fichier n'existe pas encore */
    });
    return son;
  } catch (e) {
    return null;
  }
}

function lancerSeance(donnees) {
  const bulle = document.getElementById("bulleMeditation");
  const etat = document.getElementById("etatRespiration");
  const cercle = document.getElementById("cercleRespiration");
  const btnDemarrer = document.getElementById("btnDemarrer");

  let musique;
  let index = 0;
  let enCours = false;

  function etapeSuivante() {
    if (index >= donnees.sequence.length) {
      etat.textContent = "Terminé.";
      bulle.textContent = "Voilà. C'était pas si dur, non ?";
      cercle.classList.remove("inspire", "expire");
      enCours = false;
      btnDemarrer.textContent = "Recommencer";
      btnDemarrer.disabled = false;
      return;
    }

    const etape = donnees.sequence[index];

    etat.textContent = etape.phase === "inspire" ? "Inspire..." : "Expire...";
    bulle.textContent = etape.texte;
    definirVisuel(etape);
    definirFond(etape);
    cercle.classList.toggle("inspire", etape.phase === "inspire");
    cercle.classList.toggle("expire", etape.phase === "expire");

    jouerSon(etape.audioVoix);

    index++;
    setTimeout(etapeSuivante, etape.duree);
  }

  btnDemarrer.addEventListener("click", function () {
    if (enCours) return;
    enCours = true;
    index = 0;
    btnDemarrer.disabled = true;
    btnDemarrer.textContent = "Séance en cours...";

    if (donnees.musiqueFond) {
      musique = jouerSon(donnees.musiqueFond);
      if (musique) musique.loop = true;
    }

    etapeSuivante();
  });
}

function initFullscreen() {
  const btn = document.getElementById("btnFullscreen");
  const stage = document.getElementById("meditationStage");

  btn.addEventListener("click", function () {
    if (!document.fullscreenElement) {
      stage.requestFullscreen().catch(function () {
        /* navigateur non compatible : tant pis */
      });
    } else {
      document.exitFullscreen();
    }
  });
}

// ---------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------
const type = typeDepuisURL();
construireNavigation(type);
initFullscreen();

fetch("data/" + type + ".json")
  .then(function (reponse) {
    if (!reponse.ok) throw new Error("Fichier introuvable");
    return reponse.json();
  })
  .then(function (donnees) {
    document.getElementById("meditationNom").textContent = donnees.nom;
    document.getElementById("meditationAccroche").textContent =
      donnees.accroche || "";
    if (donnees.sequence[0]) {
      definirVisuel(donnees.sequence[0]);
      definirFond(donnees.sequence[0]);
    }
    lancerSeance(donnees);
  })
  .catch(function () {
    afficherErreur();
  });
