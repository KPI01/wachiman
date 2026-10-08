ALTER TABLE "allowed_areas" DROP CONSTRAINT "allowed_areas_name_unique";
--> statement-breakpoint
ALTER TABLE "allowed_areas" DROP CONSTRAINT "allowed_areas_slug_unique";
--> statement-breakpoint
ALTER TABLE "allowed_areas" ADD COLUMN "site_id" text;
--> statement-breakpoint
-- El catálogo anterior era global. Cada centro recibe una copia independiente.
-- Las referencias existentes se trasladan a la copia del centro de su acceso.
DO $$
DECLARE
  area_row record;
  site_row record;
  primary_site_id text;
  scoped_area_id text;
BEGIN
  SELECT id INTO primary_site_id FROM sites ORDER BY created_at, id LIMIT 1;
  IF primary_site_id IS NULL AND EXISTS (SELECT 1 FROM allowed_areas) THEN
    RAISE EXCEPTION 'No se pueden asignar las áreas existentes: crea un centro antes de migrar.';
  END IF;

  FOR area_row IN SELECT * FROM allowed_areas WHERE site_id IS NULL LOOP
    FOR site_row IN SELECT id FROM sites LOOP
      IF site_row.id = primary_site_id THEN
        scoped_area_id := area_row.id;
        UPDATE allowed_areas SET site_id = site_row.id WHERE id = area_row.id;
      ELSE
        scoped_area_id := 'area-site-' || md5(json_build_array(area_row.id, site_row.id)::text);
        INSERT INTO allowed_areas (id, site_id, name, slug, created_at, updated_at)
        VALUES (scoped_area_id, site_row.id, area_row.name, area_row.slug, area_row.created_at, area_row.updated_at);
      END IF;

      UPDATE access_logs SET allowed_area_id = scoped_area_id
      WHERE allowed_area_id = area_row.id AND site_id = site_row.id;

      UPDATE planned_access_persons AS person SET allowed_area_id = scoped_area_id
      FROM planned_accesses AS request
      WHERE person.planned_access_id = request.id
        AND person.allowed_area_id = area_row.id AND request.site_id = site_row.id;
    END LOOP;
  END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "allowed_areas" ALTER COLUMN "site_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "allowed_areas" ADD CONSTRAINT "allowed_areas_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "allowed_areas_site_name_idx" ON "allowed_areas" USING btree ("site_id","name");
--> statement-breakpoint
CREATE UNIQUE INDEX "allowed_areas_site_slug_idx" ON "allowed_areas" USING btree ("site_id","slug");
