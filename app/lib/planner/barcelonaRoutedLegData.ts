/**
 * Barcelona: data for barcelonaRoutedLegs.ts, generated 2026-11-12 (scratchpad review/gen-data.mjs).
 *
 * Method:
 * 1. Each place was pinned on OpenStreetMap: Nominatim found the object by name next to the stored address or point (never a road,
 *    station or stop of the same name), or by the house number of the stored address; then the OpenStreetMap API gave the building's
 *    entrance nodes, and the one tagged main, or the one on the street of the address, was taken. Without such an entrance the
 *    building / shop point is used. Large places (parks, squares, streets, quarters, beaches, tour meeting points) were NOT pinned and
 *    get nothing here.
 * 2. Walking route between the two pinned points: FOSSGIS OSRM foot router (routing.openstreetmap.de), accepted only when both road
 *    points are within 30 m of the pinned points.
 * Values: walking [route km, 1 = climb (+20% time: Gràcia north, Montjuïc, Tibidabo)].
 */

/** Pinned point [lat, lng] of each place used below, and how it was chosen. */
export const BARCELONA_PINNED_POINTS: Record<string, [number, number]> = {
  "7-portes": [41.3821717, 2.1832472], // OSM node/1192702494 (amenity=restaurant) named "7 Portes"
  "arc-de-triomf": [41.3906159, 2.1802662], // OSM way/377875377 (building=triumphal_arch) named "Arc de Triomf"; entrance node/7694946214 (entrance on the street of the stored address, Passeig de Lluís Companys)
  "baluard-barceloneta": [41.3800227, 2.1888614], // OSM node/2434529465 (shop=bakery) named "Baluard"
  "barcelona-cathedral": [41.3841733, 2.1768041], // OSM relation/3298476 (amenity=place_of_worship) named "Catedral de la Santa Creu i Santa Eulàlia"; entrance node/2437970402 (entrance=main, Plaça de Sant Iu)
  "boqueria": [41.3819245, 2.1723514], // OSM relation/6288735 (amenity=marketplace) named "Mercat de Sant Josep - La Boqueria"; entrance node/7284579024 (entrance on the street of the stored address, La Rambla)
  "brunch-and-cake": [41.3882834, 2.1615596], // OSM node/4321183403 (amenity=restaurant) named "Brunch & Cake"
  "cafe-de-lopera": [41.3809698, 2.1737766], // OSM node/2896807807 (amenity=cafe) named "Cafè de l'Òpera"
  "cal-pep": [41.3839345, 2.1833856], // OSM node/1192701218 (amenity=restaurant) named "Cal PEP"
  "can-sole": [41.3789830, 2.1883542], // OSM node/4463537689 (amenity=restaurant) named "Can Solé"
  "canete": [41.3791405, 2.1731380], // OSM node/4137531392 (amenity=restaurant) named "Bar Cañete"
  "casa-batllo": [41.3917008, 2.1649663], // OSM relation/9427554 (tourism=artwork) named "Casa Batlló"; entrance node/6357890937 (entrance=main)
  "casa-mila": [41.3951924, 2.1617827], // OSM node/4184942998 (amenity=restaurant) named "El Cafè de la Pedrera"; entrance node/6071058572 (entrance=main)
  "cerveceria-catalana": [41.3924032, 2.1609008], // OSM node/1722136431 (amenity=restaurant) named "Cervecería Catalana"
  "ciutat-comtal": [41.3888272, 2.1668833], // OSM node/704066257 (amenity=restaurant) named "Ciutat Comtal"
  "conesa-entrepans": [41.3830520, 2.1771014], // OSM node/1276414622 (amenity=fast_food) named "Conesa"
  "el-nacional": [41.3906926, 2.1684789], // OSM way/467485984 (amenity=restaurant) named "El Nacional"
  "el-xampanyet": [41.3845086, 2.1816748], // OSM node/1192709211 (amenity=restaurant) named "El Xampanyet"
  "els-quatre-gats": [41.3857384, 2.1736392], // OSM node/1497595784 (amenity=bar) at the stored address, house 3
  "flax-and-kale": [41.3851539, 2.1655300], // OSM node/4163706690 (amenity=restaurant) named "Flax&Kale"
  "fundacio-joan-miro": [41.3684185, 2.1599076], // OSM relation/3347844 (tourism=museum) named "Fundació Joan Miró"; entrance node/11251163324 (entrance=main)
  "kiosko-universal": [41.3817361, 2.1713520], // OSM node/6485836185 (amenity=cafe) named "Kiosko universal"
  "la-bodegueta": [41.3935425, 2.1603166], // OSM node/4212005694 (amenity=restaurant) named "La Bodegueta"
  "la-cova-fumada": [41.3792983, 2.1891943], // OSM node/3815929010 (amenity=restaurant) named "La Cova Fumada"
  "la-isabela-rooftop": [41.3870568, 2.1743356], // OSM node/11954657889 (place=house) at the stored address, house 49
  "mercat-sant-antoni": [41.3786255, 2.1620493], // OSM way/249401797 (amenity=marketplace) named "Mercat de Sant Antoni"
  "mercat-santa-caterina": [41.3858393, 2.1779319], // OSM way/31957078 (amenity=marketplace) named "Mercat de Santa Caterina"; entrance node/7698461707 (entrance on the street of the stored address, Avinguda de Francesc Camb
  "miramar-barcelona": [41.3707947, 2.1710165], // OSM node/11961669686 (place=house) at the stored address, house 3
  "museu-historia-catalunya": [41.3808700, 2.1857421], // OSM node/6742154244 (tourism=museum) named "Museu d'Història de Catalunya"; entrance node/14132979763 (entrance=main)
  "museu-maritim": [41.3755003, 2.1764271], // OSM node/14080861534 (tourism=museum) named "Museu Marítim de Barcelona"
  "museu-picasso": [41.3849414, 2.1811447], // OSM way/188938001 (tourism=museum) named "Museu Picasso"; entrance node/7640429515 (entrance on the street of the stored address, Carrer de Montcada)
  "nomad-coffee": [41.3889108, 2.1771731], // OSM node/4138815989 (amenity=cafe) at the stored address, house 12
  "palau-musica": [41.3875837, 2.1752316], // OSM way/377216661 (amenity=theatre) named "Palau de la Música Catalana"
  "quimet-y-quimet": [41.3742220, 2.1657389], // OSM node/6634324686 (amenity=restaurant) named "Quimet & Quimet"
  "santa-maria-del-mar": [41.3833678, 2.1820281], // OSM way/51260215 (amenity=place_of_worship) named "Basílica de Santa Maria del Mar"; entrance node/7713090888 (entrance on the street of the stored address, Plaça de Sant
  "sky-bar-grand-central": [41.3851310, 2.1778655], // OSM node/4387192496 (amenity=bar) named "La Terraza del Central"
  "slowmov": [41.3984781, 2.1540192], // OSM node/4138780701 (amenity=cafe) named "SlowMov"
  "tablao-cordobes-flamenco": [41.3790183, 2.1748911], // OSM node/654251774 (amenity=restaurant) at the stored address, house 35; entrance node/7181846550 (entrance on the street of the stored address, La Rambla)
};

/** Pairs with no data in the hand-checked table: a real walking route. Only walks of at most 20 minutes are used (barcelonaRoutedLegs.ts). */
export const BARCELONA_ROUTED_WALKS: Record<string, [km: number, climb: 0 | 1]> = {
  "7-portes>museu-picasso": [0.45, 0],
  "arc-de-triomf>mercat-santa-caterina": [0.77, 0],
  "arc-de-triomf>museu-picasso": [0.76, 0],
  "baluard-barceloneta>museu-picasso": [1, 0],
  "barcelona-cathedral>tablao-cordobes-flamenco": [0.76, 0],
  "boqueria>canete": [0.38, 0],
  "boqueria>museu-maritim": [0.87, 0],
  "brunch-and-cake>casa-mila": [0.99, 0],
  "brunch-and-cake>mercat-sant-antoni": [1.29, 0],
  "cafe-de-lopera>barcelona-cathedral": [0.62, 0],
  "cafe-de-lopera>boqueria": [0.18, 0],
  "cal-pep>arc-de-triomf": [0.87, 0],
  "canete>barcelona-cathedral": [0.75, 0],
  "canete>mercat-sant-antoni": [1.23, 0],
  "canete>mercat-santa-caterina": [1.02, 0],
  "canete>museu-picasso": [1, 0],
  "casa-batllo>el-nacional": [0.41, 0],
  "casa-batllo>la-bodegueta": [0.59, 0],
  "cerveceria-catalana>casa-batllo": [0.51, 0],
  "el-xampanyet>museu-historia-catalunya": [0.66, 0],
  "el-xampanyet>museu-picasso": [0.07, 0],
  "el-xampanyet>palau-musica": [0.72, 0],
  "el-xampanyet>santa-maria-del-mar": [0.18, 0],
  "els-quatre-gats>barcelona-cathedral": [0.44, 0],
  "flax-and-kale>barcelona-cathedral": [1.07, 0],
  "fundacio-joan-miro>miramar-barcelona": [1.05, 1],
  "kiosko-universal>mercat-santa-caterina": [1, 0],
  "kiosko-universal>tablao-cordobes-flamenco": [0.53, 0],
  "la-bodegueta>casa-batllo": [0.59, 0],
  "la-cova-fumada>museu-historia-catalunya": [0.49, 0],
  "la-cova-fumada>museu-picasso": [1.09, 0],
  "mercat-santa-caterina>barcelona-cathedral": [0.35, 0],
  "mercat-santa-caterina>cal-pep": [0.57, 0],
  "mercat-santa-caterina>el-xampanyet": [0.41, 0],
  "museu-historia-catalunya>barcelona-cathedral": [1.02, 0],
  "museu-historia-catalunya>can-sole": [0.42, 0],
  "museu-historia-catalunya>la-isabela-rooftop": [1.3, 0],
  "museu-historia-catalunya>mercat-santa-caterina": [1.03, 0],
  "museu-historia-catalunya>museu-maritim": [1.32, 0],
  "museu-historia-catalunya>museu-picasso": [0.73, 0],
  "museu-historia-catalunya>sky-bar-grand-central": [0.98, 0],
  "museu-maritim>boqueria": [0.87, 0],
  "museu-maritim>canete": [0.67, 0],
  "museu-maritim>conesa-entrepans": [1.06, 0],
  "museu-maritim>kiosko-universal": [1, 0],
  "museu-maritim>museu-historia-catalunya": [1.32, 0],
  "museu-maritim>santa-maria-del-mar": [1.22, 0],
  "museu-maritim>tablao-cordobes-flamenco": [0.47, 0],
  "museu-picasso>7-portes": [0.45, 0],
  "museu-picasso>arc-de-triomf": [0.76, 0],
  "museu-picasso>canete": [1, 0],
  "museu-picasso>conesa-entrepans": [0.47, 0],
  "museu-picasso>el-xampanyet": [0.07, 0],
  "museu-picasso>palau-musica": [0.65, 0],
  "museu-picasso>santa-maria-del-mar": [0.24, 0],
  "nomad-coffee>boqueria": [1.14, 0],
  "nomad-coffee>museu-picasso": [0.65, 0],
  "nomad-coffee>santa-maria-del-mar": [0.89, 0],
  "palau-musica>7-portes": [1.06, 0],
  "palau-musica>ciutat-comtal": [0.97, 0],
  "palau-musica>el-xampanyet": [0.72, 0],
  "palau-musica>sky-bar-grand-central": [0.4, 0],
  "palau-musica>tablao-cordobes-flamenco": [1.2, 0],
  "quimet-y-quimet>fundacio-joan-miro": [1.02, 1],
  "santa-maria-del-mar>can-sole": [0.84, 0],
  "santa-maria-del-mar>el-xampanyet": [0.18, 0],
  "santa-maria-del-mar>els-quatre-gats": [0.86, 0],
  "santa-maria-del-mar>sky-bar-grand-central": [0.49, 0],
  "slowmov>casa-mila": [0.87, 1],
  "tablao-cordobes-flamenco>ciutat-comtal": [1.32, 0],
  "tablao-cordobes-flamenco>quimet-y-quimet": [1.1, 1],
  "tablao-cordobes-flamenco>sky-bar-grand-central": [0.95, 0],
};

/**
 * Walking values of the table shown to be wrong, replaced by the real route between pinned points.
 * mercat-santa-caterina>arc-de-triomf: the table said 0.495 km / 7 min, shorter than the 0.566 km straight line between the market
 * entrance and the arch; the walking route is 0.77 km.
 */
export const BARCELONA_WALK_CORRECTIONS: Record<string, [km: number, climb: 0 | 1]> = {
  "mercat-santa-caterina>arc-de-triomf": [0.77, 0],
};

/** Car distance on the road network between pinned points, for car times without a distance. Empty: no frequent car pair has both ends pinned yet. */
export const BARCELONA_CAR_ROUTE_KM: Record<string, number> = {

};
