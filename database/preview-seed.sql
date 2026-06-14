INSERT IGNORE INTO `trips`
  (`id`, `name`, `destination`, `start_date`, `end_date`, `default_currencies`, `timezone`, `notes`, `is_active`)
VALUES
  (
    'active-trip',
    'Italy Trip 2026',
    'Italy',
    '2026-10-08',
    '2026-10-18',
    JSON_ARRAY('EUR', 'SGD', 'MYR'),
    'Europe/Rome',
    'Safe placeholder active trip settings for the private dashboard.',
    1
  );

INSERT IGNORE INTO `trip_travelers`
  (`id`, `trip_id`, `display_name`, `display_order`, `is_active`)
VALUES
  ('person_a', 'active-trip', 'Person A', 1, 1),
  ('person_b', 'active-trip', 'Person B', 2, 1),
  ('person_c', 'active-trip', 'Person C', 3, 1),
  ('person_d', 'active-trip', 'Person D', 4, 1);

INSERT IGNORE INTO `trip_route_stops`
  (`id`, `trip_id`, `city`, `country`, `start_date`, `end_date`, `sort_order`)
VALUES
  ('route-stop-1', 'active-trip', 'Rome', 'Italy', NULL, NULL, 1),
  ('route-stop-2', 'active-trip', 'Florence', 'Italy', NULL, NULL, 2),
  ('route-stop-3', 'active-trip', 'Venice', 'Italy', NULL, NULL, 3),
  ('route-stop-4', 'active-trip', 'Milan', 'Italy', NULL, NULL, 4);
