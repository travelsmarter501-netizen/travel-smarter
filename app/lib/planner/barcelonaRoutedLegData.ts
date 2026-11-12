/**
 * Barcelona: data for barcelonaRoutedLegs.ts, generated 2026-11-12 (third pass: visitor points with their evidence).
 *
 * Visitor point of each place, strongest evidence first:
 * - official door: an official source names the visitor door, matched on OpenStreetMap (Sagrada Família: Nativity façade on
 *   Carrer de la Marina; Casa Milà: main entrance Passeig de Gràcia 92; La Boqueria: main entrance on La Rambla 91);
 * - official address street: the official site gives only the address; the point is an entrance on the landmark's own OSM
 *   outline facing that street, else the point of the outline nearest that street (the door is not published);
 * - project address, not re-checked: the same rule with the address stored in the guide data;
 * - open-air monument: its own point; restaurant / shop: its OSM point (matched by name next to the address, or house number).
 * Large places (parks, squares, streets, quarters, beaches, tour meeting points) have no single verified point and get nothing.
 *
 * Route: FOSSGIS OSRM foot router (routing.openstreetmap.de) between the two points, accepted when each road point is within 30 m.
 * Stored apart: [route km on the street network (computed), access m from the two points to their road points (straight-line
 * estimate), 1 = climb (+20% time: Gràcia north, Montjuïc, Tibidabo)]. Two places in the same building complex get no route.
 */

/** Visitor point [lat, lng] of each place used below, with its evidence and how it was found. */
export const BARCELONA_PINNED_POINTS: Record<string, [number, number]> = {
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/1192702494 (amenity=restaurant) named "7 Portes"
  "7-portes": [41.3821717, 2.1832472],
  // open-air monument / sculpture: its own point (no door)
  //   way/377875377 (building=triumphal_arch) named "Arc de Triomf"
  "arc-de-triomf": [41.3910417, 2.1806448],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/2434529465 (shop=bakery) named "Baluard"
  "baluard-barceloneta": [41.3800227, 2.1888614],
  // official address street, door not published: catedralbcn.org: Pla de la Seu s/n (no visitor door named on the official pages)
  //   relation/3298476 (amenity=place_of_worship) named "Catedral de la Santa Creu i Santa Eulàlia"; entrance node/3884081073 (main) on the outline (relatio
  "barcelona-cathedral": [41.3842719, 2.1761538],
  // official: ajuntament.barcelona.cat/mercats (Mercat de Sant Josep - Boqueria): La Rambla 91, main entrance with the 1913 modernist arch; point = the ma
  //   relation/6288735 (amenity=marketplace) named "Mercat de Sant Josep - La Boqueria"; façade point node/1457731299 of the outline (relation/6288735) near
  "boqueria": [41.3821871, 2.1718375],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/4321183403 (amenity=restaurant) named "Brunch & Cake"
  "brunch-and-cake": [41.3882834, 2.1615596],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/2896807807 (amenity=cafe) named "Cafè de l'Òpera"
  "cafe-de-lopera": [41.3809698, 2.1737766],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/1192701218 (amenity=restaurant) named "Cal PEP"
  "cal-pep": [41.3839345, 2.1833856],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/4463537689 (amenity=restaurant) named "Can Solé"
  "can-sole": [41.3789830, 2.1883542],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/4137531392 (amenity=restaurant) named "Bar Cañete"
  "canete": [41.3791405, 2.1731380],
  // official address street, door not published: casabatllo.es/en/visit: Passeig de Gràcia 43 (no door named)
  //   relation/9427554 (tourism=artwork) named "Casa Batlló"; entrance node/6357890937 (main) on the outline (relation/9427554), 14 m from Passeig de Gràcia
  "casa-batllo": [41.3917008, 2.1649663],
  // official: lapedrera.com/en/accessibility: main entrance on Passeig de Gràcia 92
  //   relation/8974896 (tourism=artwork) named "Casa Milà"; entrance node/6071058572 (main) on the outline (relation/8974896), 16 m from Passeig de Gràcia (
  "casa-mila": [41.3951924, 2.1617827],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/1722136431 (amenity=restaurant) named "Cervecería Catalana"
  "cerveceria-catalana": [41.3924032, 2.1609008],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/704066257 (amenity=restaurant) named "Ciutat Comtal"
  "ciutat-comtal": [41.3888272, 2.1668833],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/1276414622 (amenity=fast_food) named "Conesa"
  "conesa-entrepans": [41.3830520, 2.1771014],
  // official address street, door not published: cookandtaste.net: Paradís 3 (meeting point of the market-tour class not stated)
  //   node/6053023160 (place=house) at the stored address, house 3; no outline found: the OSM object point is used
  "cook-and-taste-paella-class": [41.3832148, 2.1769501],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   way/467485984 (amenity=restaurant) named "El Nacional"
  "el-nacional": [41.3906926, 2.1684789],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/1192709211 (amenity=restaurant) named "El Xampanyet"
  "el-xampanyet": [41.3845086, 2.1816748],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/1497595784 (amenity=bar) at the stored address, house 3
  "els-quatre-gats": [41.3857384, 2.1736392],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/4163706690 (amenity=restaurant) named "Flax&Kale"
  "flax-and-kale": [41.3851539, 2.1655300],
  // address from project data (Avinguda de Miramar, 1, 08038 Barcelona, Spain), not re-checked on an official site
  //   relation/3347844 (tourism=museum) named "Fundació Joan Miró"; façade point node/1334418566 of the outline (relation/3347844) nearest Avinguda de Miram
  "fundacio-joan-miro": [41.3686379, 2.1604672],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/6485836185 (amenity=cafe) named "Kiosko universal"
  "kiosko-universal": [41.3817361, 2.1713520],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/4212005694 (amenity=restaurant) named "La Bodegueta"
  "la-bodegueta": [41.3935425, 2.1603166],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/3815929010 (amenity=restaurant) named "La Cova Fumada"
  "la-cova-fumada": [41.3792983, 2.1891943],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/11954657889 (place=house) at the stored address, house 49
  "la-isabela-rooftop": [41.3870568, 2.1743356],
  // official address street, door not published: ajuntament.barcelona.cat/mercats: C. Comte d'Urgell 1 (four entrances to the octagon, none named)
  //   way/249401797 (amenity=marketplace) named "Mercat de Sant Antoni"; entrance node/5644355198 (yes) on the outline (way/249401797), 11 m from Carrer del
  "mercat-sant-antoni": [41.3786232, 2.1628423],
  // official address street, door not published: ajuntament.barcelona.cat/mercats: Av. Francesc Cambó 16 (no door named)
  //   way/31957078 (amenity=marketplace) named "Mercat de Santa Caterina"; façade point node/2267959185 of the outline (way/31957078) nearest Avinguda de Fr
  "mercat-santa-caterina": [41.3861233, 2.1778951],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/11961669686 (place=house) at the stored address, house 3
  "miramar-barcelona": [41.3707947, 2.1710165],
  // address from project data (Plaça de Pau Vila, 3, 08039 Barcelona, Spain), not re-checked on an official site
  //   node/6742154244 (tourism=museum) named "Museu d'Història de Catalunya"; no outline found: the OSM object point is used
  "museu-historia-catalunya": [41.3808167, 2.1858688],
  // official address street, door not published: mmb.cat/en/visit: Avinguda de les Drassanes s/n (no door named)
  //   node/14080861534 (tourism=museum) named "Museu Marítim de Barcelona"; entrance node/4147506931 (yes) on the outline (building way/1091176334 containin
  "museu-maritim": [41.3758698, 2.1760791],
  // official address street, door not published: museupicassobcn.cat access rules (PDF, 2026-04-20): Montcada 15-23 (no door number)
  //   way/188938001 (tourism=museum) named "Museu Picasso"; façade point node/2240993662 of the outline (way/188938001) nearest Carrer de Montcada / Placeta
  "museu-picasso": [41.3850881, 2.1809105],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/4138815989 (amenity=cafe) at the stored address, house 12
  "nomad-coffee": [41.3889108, 2.1771731],
  // address from project data (Carrer Palau de la Música, 4-6, 08003 Barcelona, Spain), not re-checked on an official site
  //   way/377216661 (amenity=theatre) named "Palau de la Música Catalana"; façade point node/3889101414 of the outline (way/377216661) nearest Carrer del Pa
  "palau-musica": [41.3875931, 2.1748926],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/6634324686 (amenity=restaurant) named "Quimet & Quimet"
  "quimet-y-quimet": [41.3742220, 2.1657389],
  // address from project data (Plaça de Santa Maria, 1, 08003 Barcelona, Spain), not re-checked on an official site
  //   way/51260215 (amenity=place_of_worship) named "Basílica de Santa Maria del Mar"; entrance node/3451507326 (yes) on the outline (way/51260215), 22 m fr
  "santa-maria-del-mar": [41.3841520, 2.1822718],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/4387192496 (amenity=bar) named "La Terraza del Central"
  "sky-bar-grand-central": [41.3851310, 2.1778655],
  // business point: OSM object matched by name next to the address, or by house number (not checked on an official site)
  //   node/4138780701 (amenity=cafe) named "SlowMov"
  "slowmov": [41.3984781, 2.1540192],
  // address from project data (La Rambla, 35, 08002 Barcelona, Spain), not re-checked on an official site
  //   node/654251774 (amenity=restaurant) at the stored address, house 35; façade point node/7181846229 of the outline (building way/216968008 containing th
  "tablao-cordobes-flamenco": [41.3792299, 2.1747003],
};

/** Pairs with no data in the hand-checked table: a real walking route. Only walks of at most 20 minutes are used (barcelonaRoutedLegs.ts). */
export const BARCELONA_ROUTED_WALKS: Record<string, [networkKm: number, accessM: number, climb: 0 | 1]> = {
  "7-portes>museu-picasso": [0.47, 5, 0],
  "arc-de-triomf>mercat-santa-caterina": [0.77, 0, 0],
  "arc-de-triomf>museu-picasso": [0.79, 2, 0],
  "baluard-barceloneta>museu-picasso": [1.03, 8, 0],
  "barcelona-cathedral>tablao-cordobes-flamenco": [0.76, 3, 0],
  "boqueria>canete": [0.44, 7, 0],
  "boqueria>museu-maritim": [0.9, 1, 0],
  "brunch-and-cake>casa-mila": [0.99, 20, 0],
  "cafe-de-lopera>barcelona-cathedral": [0.55, 9, 0],
  "cafe-de-lopera>boqueria": [0.25, 10, 0],
  "cal-pep>arc-de-triomf": [0.93, 2, 0],
  "cal-pep>museu-maritim": [1.32, 2, 0],
  "canete>barcelona-cathedral": [0.77, 6, 0],
  "canete>mercat-sant-antoni": [1.26, 6, 0],
  "canete>mercat-santa-caterina": [1.06, 6, 0],
  "canete>museu-picasso": [0.98, 8, 0],
  "casa-batllo>el-nacional": [0.41, 31, 0],
  "casa-batllo>la-bodegueta": [0.59, 6, 0],
  "cerveceria-catalana>casa-batllo": [0.51, 12, 0],
  "conesa-entrepans>cook-and-taste-paella-class": [0.03, 7, 0],
  "cook-and-taste-paella-class>ciutat-comtal": [1.19, 6, 0],
  "cook-and-taste-paella-class>el-xampanyet": [0.56, 8, 0],
  "cook-and-taste-paella-class>flax-and-kale": [1.15, 7, 0],
  "cook-and-taste-paella-class>museu-maritim": [1.06, 2, 0],
  "cook-and-taste-paella-class>sky-bar-grand-central": [0.4, 15, 0],
  "el-xampanyet>museu-historia-catalunya": [0.66, 18, 0],
  "el-xampanyet>museu-picasso": [0.09, 8, 0],
  "el-xampanyet>palau-musica": [0.8, 11, 0],
  "el-xampanyet>santa-maria-del-mar": [0.08, 9, 0],
  "els-quatre-gats>barcelona-cathedral": [0.38, 3, 0],
  "els-quatre-gats>cook-and-taste-paella-class": [0.52, 5, 0],
  "flax-and-kale>barcelona-cathedral": [1.01, 5, 0],
  "fundacio-joan-miro>miramar-barcelona": [0.99, 22, 1],
  "kiosko-universal>cook-and-taste-paella-class": [0.68, 28, 0],
  "kiosko-universal>mercat-santa-caterina": [0.99, 26, 0],
  "kiosko-universal>tablao-cordobes-flamenco": [0.5, 29, 0],
  "la-bodegueta>casa-batllo": [0.59, 6, 0],
  "la-cova-fumada>museu-historia-catalunya": [0.49, 15, 0],
  "la-cova-fumada>museu-picasso": [1.12, 5, 0],
  "mercat-santa-caterina>barcelona-cathedral": [0.32, 0, 0],
  "mercat-santa-caterina>cal-pep": [0.62, 2, 0],
  "mercat-santa-caterina>cook-and-taste-paella-class": [0.48, 2, 0],
  "mercat-santa-caterina>el-xampanyet": [0.46, 6, 0],
  "museu-historia-catalunya>barcelona-cathedral": [1.08, 12, 0],
  "museu-historia-catalunya>can-sole": [0.42, 15, 0],
  "museu-historia-catalunya>cook-and-taste-paella-class": [1.01, 14, 0],
  "museu-historia-catalunya>la-isabela-rooftop": [1.3, 13, 0],
  "museu-historia-catalunya>mercat-santa-caterina": [1.09, 12, 0],
  "museu-historia-catalunya>museu-maritim": [1.29, 12, 0],
  "museu-historia-catalunya>museu-picasso": [0.75, 14, 0],
  "museu-historia-catalunya>sky-bar-grand-central": [0.98, 25, 0],
  "museu-maritim>boqueria": [0.9, 1, 0],
  "museu-maritim>canete": [0.63, 6, 0],
  "museu-maritim>conesa-entrepans": [1.03, 5, 0],
  "museu-maritim>cook-and-taste-paella-class": [1.06, 2, 0],
  "museu-maritim>els-quatre-gats": [1.33, 3, 0],
  "museu-maritim>kiosko-universal": [0.97, 26, 0],
  "museu-maritim>museu-historia-catalunya": [1.29, 12, 0],
  "museu-maritim>santa-maria-del-mar": [1.28, 3, 0],
  "museu-maritim>tablao-cordobes-flamenco": [0.47, 3, 0],
  "museu-picasso>7-portes": [0.47, 5, 0],
  "museu-picasso>arc-de-triomf": [0.79, 2, 0],
  "museu-picasso>canete": [0.98, 8, 0],
  "museu-picasso>conesa-entrepans": [0.44, 7, 0],
  "museu-picasso>cook-and-taste-paella-class": [0.47, 4, 0],
  "museu-picasso>el-xampanyet": [0.09, 8, 0],
  "museu-picasso>palau-musica": [0.71, 7, 0],
  "museu-picasso>santa-maria-del-mar": [0.17, 5, 0],
  "nomad-coffee>boqueria": [1.13, 4, 0],
  "nomad-coffee>museu-picasso": [0.63, 5, 0],
  "nomad-coffee>santa-maria-del-mar": [0.79, 6, 0],
  "palau-musica>7-portes": [1.03, 8, 0],
  "palau-musica>ciutat-comtal": [0.88, 9, 0],
  "palau-musica>el-xampanyet": [0.8, 11, 0],
  "palau-musica>sky-bar-grand-central": [0.43, 18, 0],
  "palau-musica>tablao-cordobes-flamenco": [1.14, 8, 0],
  "quimet-y-quimet>fundacio-joan-miro": [0.96, 2, 1],
  "santa-maria-del-mar>can-sole": [0.89, 6, 0],
  "santa-maria-del-mar>el-xampanyet": [0.08, 9, 0],
  "santa-maria-del-mar>els-quatre-gats": [0.94, 6, 0],
  "santa-maria-del-mar>sky-bar-grand-central": [0.51, 16, 0],
  "slowmov>casa-mila": [0.87, 18, 1],
  "tablao-cordobes-flamenco>ciutat-comtal": [1.29, 7, 0],
  "tablao-cordobes-flamenco>quimet-y-quimet": [1.07, 5, 1],
  "tablao-cordobes-flamenco>sky-bar-grand-central": [0.92, 16, 0],
};

/**
 * Walking values of the table shown to be wrong, replaced by the real route.
 * mercat-santa-caterina>arc-de-triomf: the table said 0.495 km / 7 min, shorter than the straight line from the market's
 * façade on Avinguda de Francesc Cambó (its official address) to the arch; the route between them is 0.77 km.
 */
export const BARCELONA_WALK_CORRECTIONS: Record<string, [networkKm: number, accessM: number, climb: 0 | 1]> = {
  "mercat-santa-caterina>arc-de-triomf": [0.77, 0, 0],
};

/** Car distance on the road network between the two points, for car times without a distance. Empty: no frequent car pair has both points. */
export const BARCELONA_CAR_ROUTE_KM: Record<string, number> = {

};
