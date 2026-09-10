// =================================================================
// FICHIER : meditation.js
// Ce script gère TOUTE la logique de la page meditation.html :
// - lire quel type de méditation afficher (via l'URL)
// - aller chercher son contenu dans le bon fichier JSON
// - faire défiler les étapes (texte, image, fond, son)
// - gérer le chrono et le bouton pause
// - gérer le plein écran
// =================================================================

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

// Lit le paramètre "?type=..." dans l'URL de la page.
// Exemple : meditation.html?type=colere -> renvoie "colere"
// Si aucun paramètre n'est présent, on retombe sur "colere" par défaut,
// plutôt que d'afficher une page vide.
function typeDepuisURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("type") || "colere";
}

// Construit dynamiquement les boutons de navigation en haut de page
// (un bouton par type de méditation), et met en évidence (classe
// "actif") celui qui correspond à la page actuellement affichée.
function construireNavigation(typeActuel) {
  const nav = document.getElementById("meditationSwitch");
  TYPES_MEDITATION.forEach(function (t) {
    const lien = document.createElement("a");
    lien.href = "meditation.html?type=" + t.id;
    lien.textContent = t.label;
    // Si ce bouton correspond au type actuellement affiché, on lui
    // ajoute la classe "actif" pour le mettre en évidence visuellement.
    lien.className =
      "meditation-switch-item" + (t.id === typeActuel ? " actif" : "");
    nav.appendChild(lien);
  });
}

// Appelée quand le fetch() du JSON échoue (fichier introuvable,
// mauvais nom, etc.). On cache tout le contenu de la séance et on
// affiche un message d'erreur propre à la place, plutôt que de
// laisser une page à moitié chargée ou une erreur en console.
function afficherErreur() {
  document.getElementById("meditationIntro").hidden = true;
  document.getElementById("cercleRespiration").hidden = true;
  document.getElementById("etatRespiration").hidden = true;
  document.getElementById("chrono").hidden = true;
  document.getElementById("bulleMeditation").hidden = true;
  document.querySelector(".meditation-controles").hidden = true;
  document.getElementById("meditationErreur").hidden = false;
}

// ---------------------------------------------------------------
// Gestion du visuel du personnage (image reelle OU repli en CSS)
// ---------------------------------------------------------------
// Principe : chaque étape du JSON peut préciser une image
// (etape.image). On essaie de la charger. Si elle existe -> on
// l'affiche. Si elle n'existe pas encore (fichier manquant) -> on
// affiche automatiquement le personnage dessiné en CSS à la place,
// avec la bonne humeur. Comme ça, le site fonctionne dès maintenant
// même sans les vraies illustrations, et bascule tout seul le jour
// où elles sont ajoutées.
function definirVisuel(etape) {
  const img = document.getElementById("mascotImage");
  const mascotCss = document.getElementById("mascotWrap");

  // Cas où l'étape ne précise même pas de champ "image" dans le JSON :
  // on ne tente rien, on affiche direct le personnage en CSS.
  if (!etape.image) {
    img.hidden = true;
    mascotCss.hidden = false;
    definirHumeur(etape.humeur);
    return;
  }

  // On tente de charger la vraie image. onload/onerror sont deux
  // "évènements" du navigateur : l'un se déclenche si le fichier a
  // pu être chargé avec succès, l'autre s'il a échoué (404, mauvais
  // format, etc.). On définit ce qui doit se passer dans les deux cas
  // AVANT de lancer le chargement (ligne img.src plus bas).
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
  // C'est cette ligne qui déclenche réellement le chargement de
  // l'image par le navigateur (rien ne se passe tant qu'on ne fixe
  // pas .src).
  img.src = etape.image;
}

// Change l'expression du personnage dessiné en CSS en changeant sa
// classe CSS (mood-zen, mood-enerve, mood-tres-enerve, mood-grincheux).
// C'est le fichier style.css qui définit à quoi ressemble chaque humeur
// (inclinaison des sourcils, forme de la bouche...) via des variables
// CSS (--brow-rot, --mouth-curve).
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
// Pourquoi DEUX calques et pas un seul ?
// Si on changeait juste le fond d'un seul élément, le changement
// serait brutal (l'ancien fond disparaît instantanément, le nouveau
// apparaît instantanément). En gardant deux calques superposés au
// même endroit, on peut faire disparaître l'un EN FONDU pendant que
// l'autre apparaît EN FONDU (géré par la transition CSS sur la
// propriété "opacity"). calqueActif retient lequel des deux est
// actuellement visible, pour savoir lequel utiliser au prochain appel.
let calqueActif = "A";

function definirFond(etape) {
  const calques = {
    A: document.getElementById("bgLayerA"),
    B: document.getElementById("bgLayerB"),
  };
  const ancien = calques[calqueActif];
  // On calcule quel est le "prochain" calque (celui qui n'est pas
  // actuellement affiché), pour y préparer le nouveau fond.
  const nouveauKey = calqueActif === "A" ? "B" : "A";
  const nouveau = calques[nouveauKey];

  // Fonction interne qui effectue la bascule visuelle : on rend le
  // nouveau calque visible (classe "visible" -> opacity: 1 en CSS) et
  // on cache l'ancien (opacity: 0). La transition CSS fait le fondu
  // automatiquement entre les deux états.
  function basculer() {
    nouveau.classList.add("visible");
    ancien.classList.remove("visible");
    calqueActif = nouveauKey;
  }

  // On réinitialise le calque qui va recevoir le nouveau fond, pour
  // repartir sur une base propre (retire toute classe bg-xxx et toute
  // image de fond laissée par un appel précédent).
  nouveau.className = "meditation-bg-layer";
  nouveau.style.backgroundImage = "";

  // Si le JSON ne précise pas de champ "fond" pour cette étape, on
  // applique directement le degrade de repli correspondant à l'humeur.
  if (!etape.fond) {
    nouveau.classList.add("bg-" + etape.humeur);
    basculer();
    return;
  }

  // Meme logique de test que pour le personnage : on essaie de
  // charger l'image de fond avant de l'utiliser vraiment. On utilise
  // ici un objet Image() "invisible" (jamais ajouté à la page) juste
  // pour tester si le fichier existe, sans l'afficher directement.
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

// Joue un fichier son (voix, musique...). Enveloppé dans un
// try/catch et un .catch() pour ne jamais faire planter le reste du
// script si le fichier n'existe pas encore ou si le navigateur
// bloque la lecture automatique (règle de sécurité fréquente sur les
// audios/vidéos). On renvoie l'objet Audio créé pour pouvoir le
// mettre en pause plus tard (utile pour la musique de fond).
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

// Transforme une durée en millisecondes (ex: 125000) en texte
// "minutes:secondes" lisible (ex: "2:05"). Math.ceil (arrondi au
// dessus) évite d'afficher "0:00" une fraction de seconde trop tôt.
// padStart(2, "0") garantit que les secondes s'affichent toujours
// sur 2 chiffres (ex: "5" devient "05").
function formaterTemps(millisecondes) {
  const totalSecondes = Math.max(0, Math.ceil(millisecondes / 1000));
  const minutes = Math.floor(totalSecondes / 60);
  const secondes = totalSecondes % 60;
  return minutes + ":" + String(secondes).padStart(2, "0");
}

// ---------------------------------------------------------------
// Coeur du reacteur : orchestre toute la seance (texte, image, son,
// chrono, pause) a partir des donnees lues dans le JSON.
// ---------------------------------------------------------------
function lancerSeance(donnees) {
  // On recupere une seule fois, au debut, tous les elements HTML
  // dont on aura besoin -- evite de refaire des recherches dans la
  // page a chaque etape (plus rapide, plus lisible).
  const bulle = document.getElementById("bulleMeditation");
  const etat = document.getElementById("etatRespiration");
  const cercle = document.getElementById("cercleRespiration");
  const chrono = document.getElementById("chrono");
  const btnDemarrer = document.getElementById("btnDemarrer");
  const btnPause = document.getElementById("btnPause");

  // Duree totale = somme des durees de chaque etape. Affichee des le
  // chargement, avant meme de lancer la seance, pour donner une idee
  // du temps que ca va prendre.
  const dureeTotale = donnees.sequence.reduce(function (somme, e) {
    return somme + e.duree;
  }, 0);
  chrono.textContent = formaterTemps(dureeTotale);

  // ---- Variables d'etat de la seance ----
  // Toutes ces variables vivent "a l'interieur" de lancerSeance et
  // sont partagees par les fonctions definies juste en dessous
  // (passerEtapeSuivante, tick, etc.) grace a la fermeture JS
  // (closure) : ces fonctions "se souviennent" du contexte dans
  // lequel elles ont ete creees.
  let musique; // reference vers le son de fond, pour pouvoir le mettre en pause
  let index = -1; // indice de l'etape en cours dans donnees.sequence (-1 = pas encore commence)
  let enCours = false; // true des que la seance a ete lancee (empeche de la relancer par-dessus elle-meme)
  let enPause = false; // true quand le bouton Pause a ete active
  let tempsRestantGlobal = dureeTotale; // ce qui reste avant la fin de TOUTE la seance
  let tempsRestantEtape = 0; // ce qui reste avant de passer a l'etape suivante
  let dernierTick = null; // horodatage (timestamp) du dernier passage de tick(), pour calculer le temps ecoule
  let intervalId = null; // identifiant renvoye par setInterval(), necessaire pour pouvoir l'arreter avec clearInterval()

  // Passe a l'etape suivante de la sequence : met a jour le texte,
  // l'image, le fond, le son, et relance le decompte pour cette
  // nouvelle etape. Si on a deja affiche la derniere etape, termine
  // la seance a la place.
  function passerEtapeSuivante() {
    index++;
    if (index >= donnees.sequence.length) {
      terminerSeance();
      return;
    }

    const etape = donnees.sequence[index];
    tempsRestantEtape = etape.duree; // reinitialise le compte a rebours de cette etape precise

    etat.textContent = etape.phase === "inspire" ? "Inspire..." : "Expire...";
    bulle.textContent = etape.texte;
    definirVisuel(etape);
    definirFond(etape);
    // toggle(classe, condition) : ajoute la classe si condition est
    // vraie, la retire sinon. Ici, une seule des deux classes
    // "inspire"/"expire" est active a la fois sur le cercle, ce qui
    // declenche l'agrandissement ou le retrecissement en CSS.
    cercle.classList.toggle("inspire", etape.phase === "inspire");
    cercle.classList.toggle("expire", etape.phase === "expire");

    jouerSon(etape.audioVoix);
  }

  // Appelee une fois que toutes les etapes ont ete jouees. Remet
  // l'interface dans un etat "fin de seance" et permet de relancer.
  function terminerSeance() {
    clearInterval(intervalId); // arrete definitivement le tick, sinon il continuerait de tourner pour rien
    etat.textContent = "Terminé.";
    bulle.textContent = "Voilà. C'était pas si dur, non ?";
    cercle.classList.remove("inspire", "expire");
    chrono.textContent = "0:00";
    enCours = false;
    btnDemarrer.textContent = "Recommencer";
    btnDemarrer.disabled = false;
    btnPause.disabled = true;
    btnPause.textContent = "Pause";
  }

  // ---- Le "tick" : coeur du systeme de chrono/pause ----
  // Cette fonction est appelee automatiquement toutes les 200ms par
  // setInterval (voir plus bas). A chaque appel, elle calcule combien
  // de temps REEL s'est ecoule depuis le tick precedent (le "delta"),
  // et decompte ce delta du temps restant. C'est cette approche par
  // "temps ecoule reel" (plutot que de simplement compter les
  // intervalles) qui permet la pause : il suffit de ne rien decompter
  // quand enPause est vrai, sans avoir a annuler/relancer quoi que
  // ce soit.
  function tick() {
    const maintenant = performance.now(); // horloge tres precise du navigateur, en millisecondes
    const delta = maintenant - dernierTick; // temps ecoule depuis le tick precedent
    dernierTick = maintenant;

    // Si la seance est en pause, on met a jour la reference de temps
    // (ligne du dessus) mais on ne decompte rien -- c'est exactement
    // ce qui "gele" le chrono et l'avancement de la sequence.
    if (enPause) return;

    tempsRestantGlobal = Math.max(0, tempsRestantGlobal - delta);
    tempsRestantEtape -= delta;
    chrono.textContent = formaterTemps(tempsRestantGlobal);

    // Des que le temps de l'etape en cours est ecoule, on passe a la
    // suivante. Comme ce test se fait a chaque tick (5 fois par
    // seconde), la transition se declenche presque exactement au bon
    // moment, sans avoir besoin d'un minuteur separe par etape.
    if (tempsRestantEtape <= 0) {
      passerEtapeSuivante();
    }
  }

  // ---- Bouton "Lancer la seance" / "Recommencer" ----
  btnDemarrer.addEventListener("click", function () {
    if (enCours) return; // simple garde-fou : ignore les clics si une seance tourne deja
    enCours = true;
    enPause = false;
    index = -1; // repart de zero : le premier appel a passerEtapeSuivante() l'incrementera a 0
    tempsRestantGlobal = dureeTotale;

    btnDemarrer.disabled = true;
    btnDemarrer.textContent = "Séance en cours...";
    btnPause.disabled = false;
    btnPause.textContent = "Pause";

    if (donnees.musiqueFond) {
      musique = jouerSon(donnees.musiqueFond);
      if (musique) musique.loop = true; // la musique de fond se repete en boucle pendant toute la seance
    }

    dernierTick = performance.now(); // point de depart pour le calcul du premier "delta" dans tick()
    passerEtapeSuivante(); // affiche tout de suite la toute premiere etape, sans attendre le premier tick
    clearInterval(intervalId); // securite : coupe un eventuel interval encore actif d'une seance precedente
    intervalId = setInterval(tick, 200); // lance le "moteur" : tick() sera appelee toutes les 200ms
  });

  // ---- Bouton "Pause" / "Reprendre" ----
  btnPause.addEventListener("click", function () {
    if (!enCours) return; // pas de pause possible si aucune seance n'est en cours
    enPause = !enPause; // inverse l'etat : pause devient reprise, et inversement, a chaque clic

    if (enPause) {
      btnPause.textContent = "Reprendre";
      if (musique) musique.pause();
    } else {
      // Point important : sans cette ligne, le PROCHAIN tick()
      // calculerait un delta enorme (tout le temps passe EN PAUSE),
      // ce qui ferait brutalement sauter le chrono en avant. En
      // reinitialisant dernierTick au moment exact de la reprise, le
      // decompte repart proprement, comme si rien ne s'etait passe
      // pendant la pause.
      dernierTick = performance.now();
      btnPause.textContent = "Pause";
      if (musique)
        musique.play().catch(function () {
          /* pas grave */
        });
    }
  });
}

// Active le bouton plein ecran : bascule entre mode normal et mode
// plein ecran a chaque clic, en utilisant l'API native Fullscreen du
// navigateur (pas besoin de librairie externe).
function initFullscreen() {
  const btn = document.getElementById("btnFullscreen");
  const stage = document.getElementById("meditationStage");

  btn.addEventListener("click", function () {
    // document.fullscreenElement est rempli automatiquement par le
    // navigateur des qu'un element est en plein ecran (sinon il vaut
    // null). Ca permet de savoir dans quel etat on est actuellement.
    if (!document.fullscreenElement) {
      stage.requestFullscreen().catch(function () {
        /* navigateur non compatible : tant pis */
      });
    } else {
      document.exitFullscreen();
    }
  });
}

// =================================================================
// POINT D'ENTREE DU SCRIPT
// Tout ce qui suit s'execute immediatement des que le fichier est
// charge par la page (pas besoin d'attendre un evenement particulier
// puisque la balise <script> est placee juste avant </body>, donc
// tout le HTML au-dessus est deja charge).
// =================================================================

const type = typeDepuisURL(); // ex: "colere"
construireNavigation(type); // affiche les 7 boutons de navigation en haut
initFullscreen(); // branche le bouton plein ecran

// Va chercher le fichier JSON correspondant au type demande.
// fetch() renvoie une "Promise" : un objet qui represente un
// resultat pas encore disponible. Les .then() s'executent les uns
// apres les autres une fois chaque etape terminee avec succes ; le
// .catch() final intercepte n'importe quelle erreur survenue a
// n'importe quel moment de la chaine (fichier introuvable, JSON mal
// forme, etc.).
fetch("data/" + type + ".json")
  .then(function (reponse) {
    // reponse.ok vaut false pour les erreurs HTTP (404, 500...) --
    // fetch() ne considere PAS ca comme une erreur automatiquement,
    // il faut donc verifier soi-meme et déclencher une erreur a la
    // main avec "throw" si besoin, pour que le .catch() plus bas la
    // recupere.
    if (!reponse.ok) throw new Error("Fichier introuvable");
    return reponse.json(); // convertit le texte brut recu en objet JS utilisable
  })
  .then(function (donnees) {
    document.getElementById("meditationNom").textContent = donnees.nom;
    document.getElementById("meditationAccroche").textContent =
      donnees.accroche || ""; // "|| ''" evite d'afficher "undefined" si le champ n'existe pas dans le JSON
    if (donnees.sequence[0]) {
      // Affiche l'apparence de la toute premiere etape des le
      // chargement de la page, avant meme que l'utilisateur ne
      // clique sur "Lancer la seance" -- evite un ecran vide.
      definirVisuel(donnees.sequence[0]);
      definirFond(donnees.sequence[0]);
    }
    lancerSeance(donnees); // met en place tous les boutons et attend le clic sur "Lancer"
  })
  .catch(function () {
    afficherErreur();
  });

// ---------------------------------------------------------------
// "Fais-le parler" : le visiteur ecrit un texte, le personnage le
// lit a voix haute. Utilise la meme fonction serverless que la page
// dediee (/api/generer-voix) -- la cle ElevenLabs reste toujours
// cote serveur, jamais visible ici.
// ---------------------------------------------------------------
(function initVoixLibre() {
  const form = document.getElementById("formVoixLibre");
  const texteInput = document.getElementById("texteVoixLibre");
  const btn = document.getElementById("btnVoixLibre");
  const message = document.getElementById("voixLibreMessage");
  const lecteur = document.getElementById("voixLibreAudio");

  if (!form) return; // securite si ce bloc n'existe pas sur une autre page

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const texte = texteInput.value.trim();
    if (!texte) return;

    btn.disabled = true;
    btn.textContent = "Génération en cours...";
    message.hidden = true;
    lecteur.hidden = true;

    try {
      const reponse = await fetch("/api/generer-voix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: texte }),
      });

      if (!reponse.ok) {
        const corpsErreur = await reponse.json().catch(function () {
          return {};
        });
        throw new Error(corpsErreur.erreur || "Une erreur est survenue.");
      }

      const blobAudio = await reponse.blob();
      const url = URL.createObjectURL(blobAudio);
      lecteur.src = url;
      lecteur.hidden = false;
      lecteur.play().catch(function () {
        /* la personne devra cliquer play elle-meme */
      });
    } catch (erreur) {
      message.textContent = "Oups : " + erreur.message;
      message.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = "Faire parler le personnage";
    }
  });
})();
