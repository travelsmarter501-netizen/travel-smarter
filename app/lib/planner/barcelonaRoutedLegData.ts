/**
 * Barcelona: data for barcelonaRoutedLegs.ts, generated 2026-11-12, entrance rule corrected the same day.
 *
 * Method:
 * 1. Each place was pinned on OpenStreetMap: Nominatim found the object by name next to the stored address or point (never a road,
 *    station or stop of the same name; the closest name first), or by the house number of the stored address. An ENTRANCE is used only
 *    when it is a node of the landmark's own outline (the matched way, or an outer way of the matched relation): the one tagged main,
 *    else the one with the official house number, else the only one. Nearness or the same street is not proof (that rule picked an
 *    apartment block, a neighbouring museum and a building at another number). Otherwise the landmark's own point is used. Large
 *    places (parks, squares, streets, quarters, beaches, tour meeting points) were NOT pinned and get nothing here.
 * 2. Walking route between the two pinned points: FOSSGIS OSRM foot router (routing.openstreetmap.de), accepted only when both road
 *    points are within 30 m of the pinned points; the distance is door to door (the route plus the walk to each road point).
 *    Two ends on the same OSM object (same building) get no route.
 * Values: walking [route km, 1 = climb (+20% time: Gràcia north, Montjuïc, Tibidabo)].
 */

/** Pinned point [lat, lng] of each place used below, and how it was chosen. */
export const BARCELONA_PINNED_POINTS: Record<string, [number, number]> = {
  "1881-sagardi": [41.3807514, 2.1860546], // OSM node/2691127106 (amenity=restaurant) named "1881 per Sargadi"
  "7-portes": [41.3821717, 2.1832472], // OSM node/1192702494 (amenity=restaurant) named "7 Portes"
  "arc-de-triomf": [41.3910417, 2.1806448], // OSM way/377875377 (building=triumphal_arch) named "Arc de Triomf"
  "baluard-barceloneta": [41.3800227, 2.1888614], // OSM node/2434529465 (shop=bakery) named "Baluard"
  "barcelona-cathedral": [41.3842719, 2.1761538], // OSM relation/3298476 (amenity=place_of_worship) named "Catedral de la Santa Creu i Santa Eulàlia"; entrance node/3884081073 (entrance=main on the landmark's own outline, 
  "brunch-and-cake": [41.3882834, 2.1615596], // OSM node/4321183403 (amenity=restaurant) named "Brunch & Cake"
  "cafe-de-lopera": [41.3809698, 2.1737766], // OSM node/2896807807 (amenity=cafe) named "Cafè de l'Òpera"
  "cal-pep": [41.3839345, 2.1833856], // OSM node/1192701218 (amenity=restaurant) named "Cal PEP"
  "can-sole": [41.3789830, 2.1883542], // OSM node/4463537689 (amenity=restaurant) named "Can Solé"
  "canete": [41.3791405, 2.1731380], // OSM node/4137531392 (amenity=restaurant) named "Bar Cañete"
  "casa-batllo": [41.3917008, 2.1649663], // OSM relation/9427554 (tourism=artwork) named "Casa Batlló"; entrance node/6357890937 (entrance=main on the landmark's own outline)
  "casa-mila": [41.3951924, 2.1617827], // OSM relation/8974896 (tourism=artwork) named "Casa Milà"; entrance node/6071058572 (entrance=main on the landmark's own outline)
  "cerveceria-catalana": [41.3924032, 2.1609008], // OSM node/1722136431 (amenity=restaurant) named "Cervecería Catalana"
  "ciutat-comtal": [41.3888272, 2.1668833], // OSM node/704066257 (amenity=restaurant) named "Ciutat Comtal"
  "conesa-entrepans": [41.3830520, 2.1771014], // OSM node/1276414622 (amenity=fast_food) named "Conesa"
  "el-nacional": [41.3906926, 2.1684789], // OSM way/467485984 (amenity=restaurant) named "El Nacional"
  "el-xampanyet": [41.3845086, 2.1816748], // OSM node/1192709211 (amenity=restaurant) named "El Xampanyet"
  "els-quatre-gats": [41.3857384, 2.1736392], // OSM node/1497595784 (amenity=bar) at the stored address, house 3
  "flax-and-kale": [41.3851539, 2.1655300], // OSM node/4163706690 (amenity=restaurant) named "Flax&Kale"
  "fundacio-joan-miro": [41.3684185, 2.1599076], // OSM relation/3347844 (tourism=museum) named "Fundació Joan Miró"; entrance node/11251163324 (entrance=main on the landmark's own outline)
  "kiosko-universal": [41.3817361, 2.1713520], // OSM node/6485836185 (amenity=cafe) named "Kiosko universal"
  "la-bodegueta": [41.3935425, 2.1603166], // OSM node/4212005694 (amenity=restaurant) named "La Bodegueta"
  "la-cova-fumada": [41.3792983, 2.1891943], // OSM node/3815929010 (amenity=restaurant) named "La Cova Fumada"
  "la-isabela-rooftop": [41.3870568, 2.1743356], // OSM node/11954657889 (place=house) at the stored address, house 49
  "mercat-sant-antoni": [41.3786255, 2.1620493], // OSM way/249401797 (amenity=marketplace) named "Mercat de Sant Antoni"
  "mercat-santa-caterina": [41.3863929, 2.1787826], // OSM way/31957078 (amenity=marketplace) named "Mercat de Santa Caterina"; entrance node/11349559732 (the only entrance on the landmark own outline)
  "miramar-barcelona": [41.3707947, 2.1710165], // OSM node/11961669686 (place=house) at the stored address, house 3
  "museu-historia-catalunya": [41.3808167, 2.1858688], // OSM node/6742154244 (tourism=museum) named "Museu d'Història de Catalunya"
  "museu-maritim": [41.3755003, 2.1764271], // OSM node/14080861534 (tourism=museum) named "Museu Marítim de Barcelona"
  "museu-picasso": [41.3851039, 2.1812015], // OSM way/188938001 (tourism=museum) named "Museu Picasso"
  "nomad-coffee": [41.3889108, 2.1771731], // OSM node/4138815989 (amenity=cafe) at the stored address, house 12
  "palau-musica": [41.3875837, 2.1752316], // OSM way/377216661 (amenity=theatre) named "Palau de la Música Catalana"
  "quimet-y-quimet": [41.3742220, 2.1657389], // OSM node/6634324686 (amenity=restaurant) named "Quimet & Quimet"
  "santa-maria-del-mar": [41.3841520, 2.1822718], // OSM way/51260215 (amenity=place_of_worship) named "Basílica de Santa Maria del Mar"; entrance node/3451507326 (the only entrance on the landmark own outline)
  "sky-bar-grand-central": [41.3851310, 2.1778655], // OSM node/4387192496 (amenity=bar) named "La Terraza del Central"
  "slowmov": [41.3984781, 2.1540192], // OSM node/4138780701 (amenity=cafe) named "SlowMov"
  "tablao-cordobes-flamenco": [41.3791435, 2.1747253], // OSM node/654251774 (amenity=restaurant) at the stored address, house 35
};

/** Pairs with no data in the hand-checked table: a real walking route. Only walks of at most 20 minutes are used (barcelonaRoutedLegs.ts). */
export const BARCELONA_ROUTED_WALKS: Record<string, [km: number, climb: 0 | 1]> = {
  "7-portes>museu-picasso": [0.48, 0],
  "arc-de-triomf>mercat-santa-caterina": [0.73, 0],
  "arc-de-triomf>museu-picasso": [0.83, 0],
  "baluard-barceloneta>mercat-santa-caterina": [1.28, 0],
  "baluard-barceloneta>museu-picasso": [1.04, 0],
  "barcelona-cathedral>tablao-cordobes-flamenco": [0.77, 0],
  "brunch-and-cake>casa-mila": [1.01, 0],
  "brunch-and-cake>mercat-sant-antoni": [1.32, 0],
  "cafe-de-lopera>barcelona-cathedral": [0.56, 0],
  "cal-pep>arc-de-triomf": [0.93, 0],
  "canete>barcelona-cathedral": [0.78, 0],
  "canete>mercat-sant-antoni": [1.26, 0],
  "canete>mercat-santa-caterina": [1.09, 0],
  "canete>museu-picasso": [1.02, 0],
  "casa-batllo>el-nacional": [0.44, 0],
  "casa-batllo>la-bodegueta": [0.59, 0],
  "cerveceria-catalana>casa-batllo": [0.52, 0],
  "el-xampanyet>museu-historia-catalunya": [0.68, 0],
  "el-xampanyet>museu-picasso": [0.1, 0],
  "el-xampanyet>palau-musica": [0.75, 0],
  "el-xampanyet>santa-maria-del-mar": [0.09, 0],
  "els-quatre-gats>barcelona-cathedral": [0.38, 0],
  "flax-and-kale>barcelona-cathedral": [1.02, 0],
  "fundacio-joan-miro>miramar-barcelona": [1.07, 1],
  "kiosko-universal>mercat-santa-caterina": [1.13, 0],
  "kiosko-universal>tablao-cordobes-flamenco": [0.54, 0],
  "la-bodegueta>casa-batllo": [0.59, 0],
  "la-cova-fumada>museu-historia-catalunya": [0.5, 0],
  "la-cova-fumada>museu-picasso": [1.12, 0],
  "mercat-santa-caterina>barcelona-cathedral": [0.43, 0],
  "mercat-santa-caterina>cal-pep": [0.5, 0],
  "mercat-santa-caterina>el-xampanyet": [0.34, 0],
  "museu-historia-catalunya>1881-sagardi": [0.04, 0],
  "museu-historia-catalunya>barcelona-cathedral": [1.09, 0],
  "museu-historia-catalunya>can-sole": [0.43, 0],
  "museu-historia-catalunya>la-isabela-rooftop": [1.32, 0],
  "museu-historia-catalunya>mercat-santa-caterina": [1.01, 0],
  "museu-historia-catalunya>museu-picasso": [0.77, 0],
  "museu-historia-catalunya>sky-bar-grand-central": [1, 0],
  "museu-maritim>canete": [0.69, 0],
  "museu-maritim>conesa-entrepans": [1.08, 0],
  "museu-maritim>kiosko-universal": [1.05, 0],
  "museu-maritim>tablao-cordobes-flamenco": [0.52, 0],
  "museu-picasso>7-portes": [0.48, 0],
  "museu-picasso>arc-de-triomf": [0.83, 0],
  "museu-picasso>canete": [1.02, 0],
  "museu-picasso>conesa-entrepans": [0.49, 0],
  "museu-picasso>el-xampanyet": [0.1, 0],
  "museu-picasso>palau-musica": [0.69, 0],
  "museu-picasso>santa-maria-del-mar": [0.17, 0],
  "nomad-coffee>museu-picasso": [0.67, 0],
  "nomad-coffee>santa-maria-del-mar": [0.8, 0],
  "palau-musica>7-portes": [1.09, 0],
  "palau-musica>ciutat-comtal": [1, 0],
  "palau-musica>el-xampanyet": [0.75, 0],
  "palau-musica>sky-bar-grand-central": [0.44, 0],
  "palau-musica>tablao-cordobes-flamenco": [1.21, 0],
  "quimet-y-quimet>fundacio-joan-miro": [1.02, 1],
  "santa-maria-del-mar>can-sole": [0.89, 0],
  "santa-maria-del-mar>el-xampanyet": [0.09, 0],
  "santa-maria-del-mar>els-quatre-gats": [0.95, 0],
  "santa-maria-del-mar>sky-bar-grand-central": [0.53, 0],
  "slowmov>casa-mila": [0.89, 1],
  "tablao-cordobes-flamenco>ciutat-comtal": [1.31, 0],
  "tablao-cordobes-flamenco>quimet-y-quimet": [1.09, 1],
  "tablao-cordobes-flamenco>sky-bar-grand-central": [0.95, 0],
};

/**
 * Walking values of the table shown to be wrong, replaced by the real route between pinned points.
 * mercat-santa-caterina>arc-de-triomf: the table said 0.495 km / 7 min, shorter than the straight line between the market and the
 * arch (0.54 km from the only entrance on the market's outline to the arch itself); the walking route between them is 0.73 km.
 */
export const BARCELONA_WALK_CORRECTIONS: Record<string, [km: number, climb: 0 | 1]> = {
  "mercat-santa-caterina>arc-de-triomf": [0.73, 0],
};

/** Car distance on the road network between pinned points, for car times without a distance. Empty: no frequent car pair has both ends pinned yet. */
export const BARCELONA_CAR_ROUTE_KM: Record<string, number> = {

};
