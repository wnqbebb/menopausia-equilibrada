# Videoteca de PLENA: edita la lista y ejecuta  python herramientas/videoteca.py sitio/contenido/videos.json
# Videoteca PLENA: fuente editable. Genera contenido/videos.json.
# Campos: id YouTube, categoría, subcategoría, título PLENA, descripción PLENA, etiquetas, módulos, opinión (1 = la autora sostiene ideas que no coinciden con la evidencia del curso)
V = [
# ---------- Nutrición, hormonas y salud ----------
('aiEKmMxrb-w','nutri','', 'Soja (1): ¿es saludable?', 'Qué aporta la soja: proteína completa, grasas insaturadas y por qué conviene elegir derivados fermentados o artesanales.', [], ['m6'], 0),
('0kkUCmpIvhE','nutri','', 'Soja (2): pros y contras', 'La autora repasa la polémica sobre la soja y por qué, a su juicio, muchos estudios negativos usan productos ultraprocesados.', [], ['m6'], 1),
('W3zkBE3u760','nutri','', 'Soja (3): isoflavonas y sus beneficios', 'Qué son las isoflavonas de la soja y cómo pueden ayudar en esta etapa dentro de una dieta variada.', [], ['m6'], 0),
('NOBGrJn0krw','nutri','', 'Soja (4): fitoestrógenos y cáncer de mama', 'Por qué los alimentos de soja no se asocian a más cáncer de mama y qué otros factores pesan más, según la ponente.', [], ['m6'], 1),
('ryrNFWPsJ3k','nutri','', '¿Anticonceptivos o soja?', 'La autora sostiene que el problema hormonal no es la soja sino las hormonas sintéticas. Opinión personal: coméntalo con tu médica antes de cambiar nada.', [], ['m6'], 1),
('K8sQVTn6Fo8','nutri','', '4 alimentos que cuidan tus hormonas', 'Legumbres, soja artesanal, grasas de calidad y crucíferas: cuatro grupos para cocinar más vegetal en la menopausia.', [], ['m6'], 0),
('8zkUWL6-XnE','nutri','', 'Qué comer ahora para equilibrar tu menopausia', 'Directo sobre vegetales frescos, caldos e hidratación. Incluye ideas de la autora (como la «acidificación») que no tienen respaldo científico.', [], ['m6'], 1),
('mKK6WKhvISs','nutri','', 'Por qué engordas aunque comas igual', 'Cuatro pilares que sí tienen sentido: agua, fuerza, luz natural y más vegetales en el plato.', [], ['m5', 'm6'], 0),
('_34V-WFXo70','nutri','', '8 soluciones naturales para el cansancio', 'Pantallas, cenas tardías, estimulantes y luz solar: hábitos que influyen en tu energía y tu sueño.', [], ['m3'], 1),
('vjfWNfXKMWE','nutri','', 'Tus hormonas y la luz del otoño', 'Cómo la luz del día marca nuestros ritmos y por qué notamos más el cambio de estación.', [], ['m1'], 0),
('a2KnT0vOWYM','nutri','', '8 hábitos de las mujeres que envejecen bien', 'Hidratación, fuerza y luz de la mañana, junto a otras costumbres personales de la autora (limpiezas, duchas frías).', [], ['m9'], 1),
('Pgr_hqD9oaA','nutri','', 'La menopausia desde la macrobiótica', 'Una mirada desde la medicina china y la macrobiótica. Ojo: cuestiona la densitometría y la terapia hormonal, que el curso sí recomienda valorar con tu médica.', [], ['m6'], 1),
('rarqk03X1p8','nutri','', 'Menos grasa, más energía después de los 40', 'Músculo, grasa abdominal e inflamación después de los 40, con nutrición basada en comida real y ejercicio adaptado.', [], ['m5', 'm6'], 0),
('ziZpUf45NaM','nutri','', '¿Baja libido a partir de los 40?', 'Qué influye en el deseo en esta etapa más allá de la edad, y qué hábitos pueden ayudar.', [], ['m7'], 0),
# ---------- Fuerza y masa muscular ----------
('SEL-py6M9pw','fuerza','', 'Evita perder músculo · 30 min', 'Fuerza con mancuernas pequeñas para mayores de 50 y menopausia, con variaciones para cuidar la zona lumbar.', ['con pesas','30 min'], ['m5'], 0),
('bB0zkmr2OFo','fuerza','', 'Evita perder músculo II · 25 min', 'Mancuernas, intervalos de cardio y equilibrio para prevenir la pérdida muscular desde casa.', ['con pesas','25 min'], ['m5'], 0),
('wGQO-ti2OHg','fuerza','', 'Fuerza para la menopausia: músculo y hueso', 'Rutina completa con mancuernas para frenar la pérdida muscular y ósea, con equilibrio y postura.', ['con pesas'], ['m5'], 0),
('onda8cmZ1qg','fuerza','', 'Glúteos y abdomen firmes', 'Sin impacto y con sobrecarga progresiva para abdomen, glúteos, piernas y espalda.', ['con pesas','sin saltos'], ['m5'], 0),
('HUKYIYKrUWo','fuerza','', 'Full body para mujeres de más de 40', 'Movilidad, core y pesas por etapas, con un baile final de recompensa.', ['con pesas'], ['m5'], 0),
('DmpZ5sPS86I','fuerza','', 'Brazos y abdomen · 30 min', 'Mancuernas ligeras o botellas para hombros, brazos y abdomen, cuidando la espalda.', ['con pesas','botellas','30 min'], [], 0),
('HzUV1M6IRAU','fuerza','', 'Eleva y fortalece tus glúteos · 24 min', 'Tren inferior con una garrafa de agua como peso: postura, articulaciones y metabolismo.', ['botellas','24 min'], [], 0),
('EJN-KhQXZ5o','fuerza','', 'Cuerpo completo contra la sarcopenia', 'Pesas en dos series por ejercicio para brazos, piernas, abdomen y espalda.', ['con pesas'], [], 0),
('BpNPZKxuk3k','fuerza','', 'Gana músculo sin material', 'Sin pesas ni saltos: sentadillas modificadas y movimientos controlados.', ['sin material','sin saltos'], [], 0),
('BtEzj1ppTdE','fuerza','', 'Fuerza de pie, sin saltos', 'Sin equipo y siempre de pie: piernas, glúteos, pecho, hombros y espalda.', ['sin material','de pie','sin saltos'], [], 0),
('h200-umT0kE','fuerza','', 'Cuerpo completo con pesas', 'Series para todo el cuerpo con sentadillas y zancadas, y estiramientos finales.', ['con pesas'], [], 0),
('cONs5dUoDXQ','fuerza','', 'Adiós sarcopenia con botellas (1)', 'Bajo impacto, de pie y con botellas: fuerza, coordinación y agilidad.', ['botellas','de pie','sin saltos'], [], 0),
('p1bz6iJ3IUs','fuerza','', 'Adiós sarcopenia con botellas (2)', 'Segunda sesión con botellas para piernas, glúteos, brazos, espalda y abdomen.', ['botellas','de pie','sin saltos'], [], 0),
('6pzJsJj6fTs','fuerza','', 'Gana músculo en casa · 20 min', 'Fuerza y resistencia con pesas ligeras para brazos, piernas, glúteos y abdomen.', ['con pesas','20 min'], [], 0),
('3ecEb7vkRhI','fuerza','', 'Pesas en casa · 45 min', 'Sesión larga de fuerza, coordinación y equilibrio con pausas para hidratarte.', ['con pesas','45 min'], [], 0),
('47hCwECZwUk','fuerza','', 'HIIT de fuerza con pesas', 'Tres series de cuatro ejercicios para toda la musculatura, con abdomen activo.', ['con pesas'], [], 0),
('WAD1bGkDwY0','fuerza','', 'Intervalos para la menopausia', 'Cuatro series combinadas con mancuernas para brazos, piernas, glúteos y core.', ['con pesas'], [], 0),
('B1iht4HDZ6o','fuerza','', 'Abdomen, glúteos y brazos · 25 min', 'Pesas pequeñas, de pie y sin saltos, por bloques combinados.', ['con pesas','de pie','sin saltos','25 min'], [], 0),
('bioyy57mlhM','fuerza','', 'Abdomen y glúteos sin equipo', 'Sentadillas dinámicas y trabajo de cintura con respiraciones finales.', ['sin material'], [], 0),
('iuUSTfWYc04','fuerza','', 'Abdomen y glúteos con pesas, de pie', 'Sentadillas sumo, torsiones y elevaciones de rodilla con mancuernas ligeras.', ['con pesas','de pie','sin saltos'], [], 0),
('I7_c_GcOI6o','fuerza','', 'Piernas y glúteos sin material', 'Puentes, zancadas y sentadillas desde varios ángulos.', ['sin material'], [], 0),
('EfNEdpEZ5T8','fuerza','', 'Piernas y glúteos isométricos', 'Posturas sostenidas para ganar resistencia en el tren inferior, especial menopausia.', ['sin material'], ['m5'], 0),
('ak1Y7f0_HM4','fuerza','', 'Piernas tonificadas sin saltar', 'Zancadas, sentadillas pulsadas y trabajo de cadera de pie y en el suelo.', ['sin material','sin saltos'], [], 0),
('dvUQq1128DA','fuerza','', 'Piernas y muslos firmes', 'Peso corporal con foco en la cara interna del muslo.', ['sin material'], [], 0),
('Nz6HCNquTOw','fuerza','', 'Glúteo y abdomen con bandas', 'Intervalos con bandas elásticas para glúteos, cuádriceps y cintura.', ['bandas'], [], 0),
('bwPhmblqPao','fuerza','', 'Bíceps, tríceps y hombros', 'Tren superior con mancuernas ligeras y movimientos de boxeo controlado.', ['con pesas'], [], 0),
('dtUbhypZ8ek','fuerza','', 'Brazos y hombros sin pesas', 'Tren superior sin equipo, con movimientos que simulan resistencia.', ['sin material'], [], 0),
('0M7CkvXMcx0','fuerza','', 'Brazos firmes con pesas ligeras', 'Tríceps y torso superior con pesas, automasaje y consejos de postura.', ['con pesas'], [], 0),
('FdCP27MtuNU','fuerza','', 'Brazos y espalda con bandas', 'Hombros, brazos y espalda con la resistencia de la banda elástica.', ['bandas'], [], 0),
('EDQ-oUmLI8k','fuerza','', 'Espalda y brazos con pesas', 'Espalda, hombros y brazos con técnicas de postura en la pared.', ['con pesas'], [], 0),
('ZgmAcvewBsw','fuerza','', 'Brazos, espalda y abdomen con banda', 'Movimientos pausados tipo pilates con banda elástica y equilibrio.', ['bandas'], [], 0),
# ---------- Cardio, baile y quema de grasa ----------
('eh_dr7au4K0','cardio','', 'Cardio para mujeres 40+', 'Intensidad media con opción con o sin saltos: corazón, energía y huesos.', ['con o sin saltos'], ['m5', 'm9'], 0),
('UuI8hVRtPNI','cardio','', 'Cardio sin saltos con pesas · 25 min', 'Cardio dinámico sin impacto con mancuernas ligeras opcionales.', ['sin saltos','con pesas','25 min'], [], 0),
('Z_nYhbSSF7E','cardio','', 'Cardio sin saltos con pesas II', 'Resistencia y fuerza a la vez, activando abdomen y suelo pélvico.', ['sin saltos','con pesas'], [], 0),
('f1pM4X2rNSY','cardio','', 'Power walking con pesas · 30 min', 'Caminata en casa al ritmo de la música con pesas y tobilleras opcionales.', ['con pesas','30 min'], ['m9'], 0),
('kYKN8SHPphQ','cardio','', 'Walk & Tone: cardio y fuerza', 'Bajo impacto y tonificación con distintos niveles.', ['sin saltos'], [], 0),
('igH2CKp_9p4','cardio','', 'Aeróbic y tonificación · 38 min', 'Pasos coreografiados que se repiten y pesas para brazos y piernas.', ['con pesas','38 min'], [], 0),
('aIKa1ZB7qbg','cardio','', 'Cardio suave para la menopausia', 'De pie y sin saltos: caminatas, torsiones y sentadillas para activar la energía.', ['de pie','sin saltos'], [], 0),
('H2BO8zzuGZE','cardio','', 'Cardio con pesas para ganar músculo', 'Boxeo, sentadillas y descanso activo para mantener el pulso alto.', ['con pesas'], [], 0),
('SWKadvJYJwA','cardio','', 'Cardio exprés · 15 min', 'Sentadillas sumo y elevaciones de talón con mancuernas, de pie y sin saltos.', ['de pie','sin saltos','15 min'], [], 0),
('xmeEXBdeMkA','cardio','', 'Cardio de pie, sin saltos', 'Sentadillas, zancadas, giros y boxeo para subir el pulso con seguridad.', ['de pie','sin saltos'], [], 0),
('IEejp0Kjnls','cardio','', 'Cardio boxeo sin saltos', 'Golpes con la fuerza de caderas y pies, con una mini lección de defensa personal.', ['de pie','sin saltos'], [], 0),
('RsvUjciL-tk','cardio','', 'Baile latino · 20 min', 'Salsa, bachata, merengue y reguetón para moverte y divertirte.', ['baile','20 min'], ['m9'], 0),
('KXbKAwZo9T8','cardio','', 'Cardio dance para principiantes', 'Clase completa de baile para empezar con energía.', ['baile','principiantes'], [], 0),
('pznCCeIen-g','cardio','', 'Rutina con bastón', 'Sin impacto ni pesas: postura, fuerza y equilibrio con un palo de escoba.', ['bastón','sin saltos'], [], 0),
('TltShTFlJFk','cardio','', 'Abdomen y cardio sin saltos', 'Cardio de pie con trabajo de cintura y abdomen.', ['de pie','sin saltos'], [], 0),
# ---------- Taichi y Qigong: quemar grasa ----------
('f3DDdUwOrZ4','taichi','grasa', 'Activación linfática con taichi', 'Movimiento consciente, golpecitos suaves y respiración para activarte de pie.', ['de pie','sin saltos'], [], 0),
('_7L5cw4GgYw','taichi','grasa', 'Caminata y taichi flow', 'Caminata estática y taichi en una práctica fluida, amable con las articulaciones.', ['de pie','sin saltos'], [], 0),
('ddw-F2OpMic','taichi','grasa', 'Taichi y aeróbic (1)', 'Rebotes suaves, posturas y sentadillas controladas con respiración profunda.', ['de pie','sin saltos'], [], 0),
('W5c1GKcPLz8','taichi','grasa', 'Taichi y aeróbic (2)', 'Taichi fluido, aeróbic de bajo impacto y automasaje.', ['de pie','sin saltos'], [], 0),
('2Duibidk9ps','taichi','grasa', 'Caminata de taichi y kung fu', 'Caminata fluida con posturas y respiración para bajar el estrés.', ['de pie','sin saltos'], [], 0),
('jzL4ghrYukU','taichi','grasa', 'Taichi cardio de 10 días', 'Taichi y cardio suave para cintura, piernas, brazos y espalda.', ['de pie','sin saltos'], [], 0),
('LbafnihWhfY','taichi','grasa', 'Taichi, qigong y kung fu', 'Movimientos dinámicos y respiración para abdomen, espalda, piernas y glúteos.', ['de pie'], [], 0),
('M4rEBFeRXKs','taichi','grasa', 'Calma tu sistema nervioso: taichi flow', 'Movimientos fluidos y respiración lenta para bajar el estrés y trabajar la zona media.', ['de pie','sin saltos'], ['m4'], 0),
('cbSVHPss5M8','taichi','grasa', 'Taichi flow y pilates asiático', 'Equilibrio, core y respiración, con automasaje final para relajarte.', ['de pie'], [], 0),
('AIJ7QGygdt4','taichi','grasa', 'Cintura y zona lumbar con qigong', 'Estiramientos, sentadillas y giros para la cintura y la espalda baja.', ['de pie'], [], 0),
('tdmM5xduBPw','taichi','grasa', 'Ejercicios asiáticos para el abdomen', 'Rutinas inspiradas en la cultura asiática para la zona media.', [], [], 0),
('IjcT9bXrO-U','taichi','grasa', 'Taichi, kung fu y qigong para moverte', 'Rutina de pie de bajo impacto para activar el cuerpo entero.', ['de pie','sin saltos'], [], 0),
# ---------- Taichi y Qigong: menopausia y energía ----------
('CFvvCLvF6lo','taichi','energia', 'Taichi para sofocos, fatiga y ansiedad', 'Movimientos suaves y respiración consciente para transitar la perimenopausia con más calma.', ['de pie','sin saltos'], ['m2'], 0),
('Sn6Bnd_fccw','taichi','energia', 'Taichi para la menstruación y la menopausia', 'Movimientos fluidos y automasaje para la retención de líquidos, los sofocos y la calma.', ['de pie','sin saltos'], ['m2'], 0),
('yoZeDnnEVEI','taichi','energia', 'Taichi para tu cerebro', 'Movimientos que coordinan ambos lados del cuerpo y masaje craneal para la memoria y la concentración.', ['de pie'], ['m4'], 0),
('8OOyRB9q4Jk','taichi','energia', 'Calentamiento articular · 15 min', 'Despierta articulaciones y circulación antes de cualquier rutina.', ['de pie','sin saltos','15 min'], ['m5'], 0),
('Fdwvz7BwXaY','taichi','energia', 'Desbloquea tu energía', 'Ejercicios de qigong para cuerpo, rostro y emociones.', [], [], 0),
('JKpRczuBYsM','taichi','energia', 'Adiós al cansancio con qigong', 'Suelo y de pie: articulaciones, fuerza y automasaje para recargarte.', [], ['m4'], 0),
# ---------- Taichi y Qigong: antiedad ----------
('d7BchHtuC6s','taichi','antiedad', 'Antiedad para la menopausia', 'Movimientos fluidos, estiramientos y percusiones suaves para la energía y el estrés.', ['de pie'], ['m9'], 0),
('Rumr5HYvv78','taichi','antiedad', 'Rutina de rejuvenecimiento', 'Flexibilidad, circulación y relajación profunda con taichi y qigong.', ['de pie'], [], 0),
('TPrRX0I-xFk','taichi','antiedad', 'Caminata meditativa de taichi', 'Pasos lentos con la respiración, expresión facial y sacudidas para soltar tensión.', ['de pie'], [], 0),
('j7JhMUM1yok','taichi','antiedad', 'Taichi en silla', 'Para hacer sentada: columna, pecho, cuello y hombros con calma.', ['silla'], [], 0),
('xpVP0tB15WQ','taichi','antiedad', 'Taichi para soltar emociones', 'Movimiento y respiración profunda para la postura y la mente.', ['de pie'], [], 0),
('smsFv37RZxo','taichi','antiedad', 'Tu rutina diaria de vitalidad (1)', 'Sentadillas suaves, estiramientos y percusiones para la agilidad.', ['de pie'], [], 0),
('xFoNmwQ7axA','taichi','antiedad', 'Tu rutina diaria de vitalidad (2)', 'Estiramientos, torsiones y respiración profunda para la postura.', ['de pie'], [], 0),
('p-D3V_n2L6k','taichi','antiedad', 'Taichi de pie (1)', 'Práctica diaria de bajo impacto, sin saltos.', ['de pie','sin saltos'], [], 0),
('VkgPfmg9t6c','taichi','antiedad', 'Taichi de pie (2)', 'Movimientos estáticos y apacibles para cada día.', ['de pie','sin saltos'], [], 0),
('7jT364O3c2M','taichi','antiedad', 'Taichi, qigong y chikung (1)', 'Movimiento consciente constante para revitalizarte.', [], [], 0),
('XpeDB3qPUqY','taichi','antiedad', 'Taichi, qigong y chikung (2)', 'Posturas, torsiones y masaje facial para relajar el sistema nervioso.', [], [], 0),
('Y9zlDW54ctc','taichi','antiedad', 'Taichi, qigong y yoga', 'Estiramientos, giros y sacudidas suaves para la vitalidad.', [], [], 0),
('I5iNkbu7P2Q','taichi','antiedad', 'Movimiento y emociones', 'Estiramientos, sacudidas y posturas para transformar el estrés en calma.', [], [], 0),
('prcSBIAA36k','taichi','antiedad', 'Cuerpo, rostro y espíritu', 'Sacudidas, masaje facial y giros suaves para cada día.', [], [], 0),
('iS7bsacAltc','taichi','antiedad', 'Sotai: calistenia japonesa', 'Movimientos suaves para la postura y la circulación, con acupresión.', [], [], 0),
('4nkfLBhJ47k','taichi','antiedad', 'Taichi y visualización', 'Giros, estiramientos y masajes con una meditación final.', [], [], 0),
('AoBAC2_W58M','taichi','antiedad', 'Taichi para la vitalidad', 'Sacudidas, estiramientos y respiración con relajación final.', [], [], 0),
('Fpa_cXjHcY4','taichi','antiedad', 'Taichi para mayores de 60', 'Movimientos fluidos y palmadas suaves, sin impacto en las articulaciones.', ['sin saltos'], [], 0),
('GX3IO_1CWCs','taichi','antiedad', 'Mejora tu equilibrio', 'Estabilidad, coordinación y postura con taichi y qigong.', ['de pie'], ['m5'], 0),
('WczxqZHNLeY','taichi','antiedad', 'Taichi flow y drenaje facial (1)', 'Posturas, giros y acupresión facial.', [], [], 0),
('GQjHNHq_SpY','taichi','antiedad', 'Taichi flow y drenaje facial (2)', 'Segunda práctica de la serie para cuerpo y rostro.', [], [], 0),
('0-U2Tr1uBhA','calma','', 'Meditación de regeneración · 15 min', 'Relajación y visualización guiada para soltar tensiones.', ['15 min'], ['m9'], 0),
# ---------- Pilates, core y suelo pélvico ----------
('HFSTDOq-27Q','pilates','', 'Core diario · 16 min', 'Con pelota: abdomen, espalda y suelo pélvico para prevenir diástasis e incontinencia.', ['pelota','16 min'], ['m5'], 0),
('Ok3fxX2iPzM','pilates','', 'Suelo pélvico y libido', 'Puentes y sentadillas coordinando respiración y contracción para evitar pérdidas.', ['suelo'], ['m7'], 0),
('HXD3_sLQZ-8','pilates','', 'Kegel y pilates para el suelo pélvico', 'Activación consciente del suelo pélvico para prevenir la incontinencia.', ['suelo'], ['m5', 'm7'], 0),
('FCt-fJCg0U4','pilates','', 'Hipopresivos para principiantes', 'Respiración y apneas que trabajan la faja abdominal y el suelo pélvico.', ['suelo','principiantes'], ['m7'], 0),
('RY6Ny9XzMZc','pilates','', 'Abdominales de pie', 'Zona media sin equipo y sin tumbarte.', ['de pie','sin material'], [], 0),
('O16RWtVA12Q','pilates','', 'Pilates de pie · 20 min', 'Musculatura profunda, postura y respiración para cualquier nivel.', ['de pie','20 min'], [], 0),
('MByljahdfUY','pilates','', 'Pilates en el suelo', 'Cuerpo completo para principiantes con suelo pélvico activo.', ['suelo','principiantes'], [], 0),
('CV6GYe2PrX0','pilates','', 'Pilates con banda elástica · 30 min', 'Fuerza, movilidad y flexibilidad con bandas abiertas y cerradas.', ['bandas','30 min'], [], 0),
('SLxAwYxq9AE','pilates','', 'Piernas y abdomen con pelota · 25 min', 'Aductores, planchas y control con una pelota blanda.', ['pelota','25 min'], [], 0),
('m2z9JKDt13A','pilates','', 'Yoga y pilates fusión', 'Flexibilidad, equilibrio y core al ritmo de la música.', [], [], 0),
# ---------- Movilidad, dolor y circulación ----------
('uUKD1Dd_tpY','movil','', 'Flow linfático de pie', 'Movimientos suaves, respiración y masaje ligero en cuello, pecho y piernas.', ['de pie'], [], 0),
('wkoMKYFY1x0','movil','', 'Piernas ligeras y circulación', 'Posturas en la pared, elevaciones y masaje para la pesadez de piernas.', [], [], 1),
('T55i30HG8O4','movil','', 'Brazos ligeros y drenaje', 'Ejercicios sin pesas y masaje suave para brazos.', [], [], 1),
('dnKbbWmukiI','movil','', 'Piernas, muslos y pantorrillas', 'Tonificación, masaje y acupresión para la circulación de las piernas.', [], [], 0),
('x5oiXcM3zRQ','movil','', 'Varices: piernas ligeras con taichi', 'Bajo impacto y estiramientos para aliviar pesadez e hinchazón.', ['de pie'], [], 0),
('sjRF4xVhLYc','movil','', 'Varices: alivia el dolor y la pesadez', 'Ejercicios de suelo y de pie para la circulación de las piernas.', [], [], 0),
('NuVYceO1DuE','movil','', 'Circulación y corazón con taichi', 'Movimientos suaves y respiración para el sistema cardiovascular.', [], [], 0),
('4TARlWmVuFE','movil','', 'Huesos fuertes: osteoporosis y osteopenia', 'Bajo impacto, estiramientos y equilibrio para caderas, columna y muñecas.', ['de pie'], ['m5', 'm8'], 0),
('mHJ0i9kkVuQ','movil','', 'Ciática y dolor lumbar', 'Estiramientos diarios en el suelo para la columna y el piramidal.', ['suelo'], [], 0),
('hyTw-ave5bE','movil','', 'Manos, muñecas y dedos sin dolor', 'Movimientos y masaje para la rigidez de artritis y artrosis.', [], [], 0),
('Wlix-pyHkFI','movil','', 'Manos ágiles', 'Ejercicios y masajes para desinflamar y dar flexibilidad a manos y dedos.', [], [], 0),
('DQUqpajSy2M','movil','', 'Gimnasia para los ojos', 'Ejercicios oculares de relajación. No sustituyen la revisión con tu oftalmóloga.', [], [], 1),
# ---------- Meditación, estrés y descanso ----------
('bmHXqw_ZUbY','calma','', 'Meditación para dormir · 15 min', 'Respiración y visualización de un atardecer para soltar el día y dormir mejor.', ['15 min'], ['m3'], 0),
('n4eGr9AtKrk','calma','', 'Baja el estrés rápido', 'Estiramientos, balanceos y automasaje para la ansiedad y el nerviosismo.', ['de pie'], ['m2', 'm3', 'm4'], 0),
# ---------- Podcast ----------
('obAzkbEQs7Y','podcast','', 'Menopausia y hormonas: todo lo que necesitas saber', 'Dos médicas explican la perimenopausia, por qué no hay que aguantar y el papel de la terapia hormonal, el ejercicio y los hábitos.', [], ['m1', 'm8'], 0),
('pvhqPkKgNOk','podcast','', '«Comer menos es lo peor que puedes hacer»', 'Por qué las dietas restrictivas empeoran los síntomas y cómo cuidar la salud metabólica con fuerza y buena comida.', [], ['m6', 'm8'], 0),
('L3YjGC4hDH0','podcast','', 'Rompiendo tabúes de la menopausia', 'Conversación desde la medicina funcional. Algunas afirmaciones sobre hormonas bioidénticas van más allá de la evidencia: decide con tu médica.', [], ['m8'], 1),
# ---------- Audiolibros ----------
('fA_0uiWOJLo','audio','', 'No estás loca, es perimenopausia', 'Audiolibro: niebla mental, ciclos y emociones explicados con ciencia y vivencias, con herramientas prácticas.', [], ['m1', 'm4'], 0),
('h1jv2hkN8UE','audio','', 'La menopausia no es el final', 'Audiolibro: sofocos, insomnio, deseo, trabajo y tu derecho a decidir informada sobre tus tratamientos.', [], ['m9'], 0),
('EH0cuspETMk','audio','', 'Menopausia a tu manera', 'Audiolibro: entender tus hormonas y armar tu plan de nutrición, movimiento y calma.', [], ['m0'], 0),
# ---------- Música ----------
('1aNaWCnNWNk','musica','', 'Música para dormir', 'Calma instrumental para tu ritual de noche.', [], ['m3'], 0),
('uAMdi0hcgDA','musica','', 'Música para tu bienestar', 'Instrumental suave para relajarte o acompañar tus estiramientos.', [], ['m0'], 0),
('k616LXUiJwQ','musica','', 'Música relajante', 'Sonidos suaves para respirar y bajar el ritmo.', [], [], 0),
]

CATS = [
 ('nutri', 'Nutrición y hormonas', 'Charlas sobre alimentación, soja y hábitos para tu energía.', 'hoja', '#2F855A', '#DCEFE2'),
 ('fuerza', 'Fuerza y músculo', 'Pesas, bandas, botellas o tu propio peso: la base contra la sarcopenia.', 'pesa', '#D2553F', '#F6D2C4'),
 ('cardio', 'Cardio y baile', 'Para tu corazón, casi todo sin saltos.', 'llama', '#FF1A5D', '#FFC1CC'),
 ('taichi', 'Taichi y qigong', 'Prácticas orientales suaves, de pie y sin saltos.', 'chispa', '#7B5EA7', '#D2CADF'),
 ('pilates', 'Pilates y suelo pélvico', 'Musculatura profunda: abdomen, postura y suelo pélvico.', 'diana', '#92333C', '#F1E4DB'),
 ('movil', 'Movilidad y circulación', 'Piernas ligeras, huesos, espalda y manos.', 'rayo', '#4A6A8A', '#DDE3EA'),
 ('calma', 'Meditación y descanso', 'Para dormir mejor y bajar la ansiedad.', 'noche', '#372937', '#E6E0F3'),
 ('podcast', 'Podcast', 'Conversaciones con especialistas.', 'consulta', '#604D53', '#F1E4DB'),
 ('audio', 'Audiolibros', 'Libros completos para escuchar.', 'libro', '#E0337A', '#FFE3EA'),
 ('musica', 'Música', 'Para acompañar tus rutinas y tu calma.', 'corazon', '#DB7F8E', '#FFDBDA'),
]
SUBS = {'grasa': 'Para moverte y quemar energía', 'energia': 'Menopausia, cerebro y energía', 'antiedad': 'Vitalidad y longevidad'}

LESSON = {  # una práctica recomendada por lección
 'm0-1': 'EH0cuspETMk', 'm1-1': 'fA_0uiWOJLo', 'm1-2': 'obAzkbEQs7Y', 'm2-1': 'CFvvCLvF6lo', 'm2-2': 'Sn6Bnd_fccw', 'm2-3': 'n4eGr9AtKrk',
 'm3-1': '1aNaWCnNWNk', 'm3-2': 'bmHXqw_ZUbY', 'm3-3': 'n4eGr9AtKrk', 'm4-1': 'yoZeDnnEVEI', 'm4-2': 'M4rEBFeRXKs', 'm4-3': 'JKpRczuBYsM', 'm4-4': '0-U2Tr1uBhA',
 'm5-1': 'mKK6WKhvISs', 'm5-2': 'SEL-py6M9pw', 'm5-3': 'HXD3_sLQZ-8', 'm6-1': 'K8sQVTn6Fo8', 'm6-2': 'rarqk03X1p8', 'm6-3': 'aiEKmMxrb-w',
 'm7-1': 'Ok3fxX2iPzM', 'm7-2': 'ziZpUf45NaM', 'm7-3': 'FCt-fJCg0U4', 'm8-1': 'obAzkbEQs7Y', 'm8-2': '4TARlWmVuFE', 'm8-3': 'h1jv2hkN8UE',
 'm9-1': 'f1pM4X2rNSY', 'm9-2': 'RsvUjciL-tk', 'm9-3': 'eh_dr7au4K0',
}

if __name__ == '__main__':
    import json, sys, collections
    ids = [v[0] for v in V]
    dup = [k for k, c in collections.Counter(ids).items() if c > 1]
    assert not dup, dup
    if len(sys.argv) > 2:
        extra = json.load(open(sys.argv[2]))
    else:  # consulta YouTube: nombre del canal y si el video se puede insertar
        import urllib.request, concurrent.futures as cf
        def meta(v):
            try:
                with urllib.request.urlopen('https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=' + v[0], timeout=20) as r:
                    return v[0], {'canal': json.load(r)['author_name']}
            except Exception:
                return v[0], {'bloqueado': True}
        with cf.ThreadPoolExecutor(10) as ex: extra = dict(ex.map(meta, V))
        print('No se pueden insertar:', [k for k, e in extra.items() if e.get('bloqueado')])
    out = {'categorias': [dict(id=c[0], nombre=c[1], desc=c[2], icono=c[3], color=c[4], fondo=c[5]) for c in CATS], 'subcategorias': SUBS,
           'videos': [], 'lecciones': LESSON}
    for v in V:
        e = extra.get(v[0], {})
        if e.get('bloqueado'): continue
        tipo = {'podcast': 'podcast', 'audio': 'audiolibro', 'musica': 'musica'}.get(v[1], 'video')
        out['videos'].append(dict(id=v[0], cat=v[1], sub=v[2], titulo=v[3], desc=v[4], tags=v[5], mods=v[6], opinion=bool(v[7]), tipo=tipo, canal=e.get('canal', '')))
    for l, vid in LESSON.items(): assert vid in ids, vid
    json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
    print(len(out['videos']), 'videos')
