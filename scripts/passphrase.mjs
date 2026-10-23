#!/usr/bin/env node
// Génère une phrase secrète facile à taper sur un téléphone : 5 mots français tirés au hasard (~45 bits)
// + PBKDF2 × 600 000 ⇒ une attaque par force brute coûterait des siècles de calcul.
import { webcrypto as crypto } from 'node:crypto'

const WORDS = `abeille abricot accord acrobate aigle aimant album alouette amande ambre ananas ancre anneau antilope aquarelle arbre arc archipel argent armoire aube aurore avion azur badge baie baleine bambou banane banjo baobab barque bassin bateau baume berceau bijou biscuit bison blason bleuet bocal bougie boussole branche brindille brise brume bulle cabane cacao cactus cadran calme camelia canard cannelle canyon capuche caramel carnet carrousel cascade castor cerise chaton chemin cheval chouette cigale citron clairiere clementine colibri colline comete corail coton coquelicot cristal cygne dauphin delta desert diamant domino dragon dune ecume ecureuil eclair emeraude encre epice escale etoile falaise faucon felin fenouil festin feuille figue flamant flamme flocon fontaine foret fougere fraise framboise galet gazelle geyser girafe givre glacier gondole goyave grenade grillon guitare hamac harpe herisson hibou horizon iris ivoire jade jardin jasmin jonquille kayak kiwi lagon lanterne laurier lavande liane licorne lilas lion loutre luciole lumiere lune lynx macaron magnolia mandarine mangue marbre marine melodie menthe meridien miel mimosa mirabelle montagne mousse muguet myrtille nacre narval nectar neige nenuphar noisette nuage oasis ocean olive opale orage orchidee origami ours paille palmier panda papillon paradis passerelle pastel pelican perle phare piano pivoine plage plume poivre pollen pomme prairie prisme pyramide quartz radeau raisin recif renard riviere roseau rubis ruisseau sable safran saphir satin saule sequoia sirene soleil sorbet source tambour tango tigre tilleul toucan tournesol trefle tulipe turquoise vague vanille velours vent verger violette voilier volcan zebre zephyr`.split(/\s+/)

const pick = () => WORDS[crypto.getRandomValues(new Uint32Array(1))[0] % WORDS.length]
const chosen = new Set()
while (chosen.size < 5) chosen.add(pick())
const phrase = [...chosen].join('-')
console.log(`\n  ${phrase}\n\n  À mettre dans .env.local :  CP26_PASSPHRASE=${phrase}\n`)
