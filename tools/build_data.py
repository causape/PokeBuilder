#!/usr/bin/env python3
"""
Genera data/pokedata.js a partir de los CSV públicos de PokeAPI
(https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv).

Uso:  python tools/build_data.py

Solo hace falta ejecutarlo de nuevo si quieres actualizar los datos
(por ejemplo, cuando PokeAPI añada pokémon o movimientos nuevos).
"""
import csv
import io
import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BASE = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/"
FILES = [
    "pokemon", "pokemon_species", "pokemon_species_names", "pokemon_forms", "pokemon_form_names",
    "pokemon_types", "pokemon_stats", "pokemon_abilities", "types",
    "moves", "move_names", "move_flavor_text", "move_effect_prose",
    "abilities", "ability_names", "ability_flavor_text", "ability_prose",
    "items", "item_names", "item_flavor_text", "item_prose",
]

# Categorías de objetos que se pueden equipar en combate (ver item_categories.csv).
ITEM_CATEGORIES = {
    "3": "berry", "4": "berry", "5": "berry", "6": "berry", "7": "berry",
    "12": "held", "13": "held", "15": "held", "18": "species",
    "17": "plate", "19": "type", "42": "gem", "44": "mega", "45": "memory",
}
TYPE_ES = {
    "Normal": "Normal", "Fire": "Fuego", "Water": "Agua", "Electric": "Eléctrico",
    "Grass": "Planta", "Ice": "Hielo", "Fighting": "Lucha", "Poison": "Veneno",
    "Ground": "Tierra", "Flying": "Volador", "Psychic": "Psíquico", "Bug": "Bicho",
    "Rock": "Roca", "Ghost": "Fantasma", "Dragon": "Dragón", "Dark": "Siniestro",
    "Steel": "Acero", "Fairy": "Hada",
}
TYPE_RE = re.compile(r"\b(" + "|".join(TYPE_ES) + r")\b")
ES, EN = "7", "9"  # ids de idioma en PokeAPI
OUT = Path(__file__).resolve().parent.parent / "data" / "pokedata.js"

# Textos que los juegos recientes ponen a los movimientos eliminados.
REMOVED_MOVE_TEXT = re.compile(
    r"(recomienda olvidar|no se puede usar|no puede usarse|ya no se puede"
    r"|can.t be used|recommended that this move is forgotten)",
    re.IGNORECASE,
)
DAMAGE_CLASS = {"1": "status", "2": "physical", "3": "special"}


def fetch(name):
    with urllib.request.urlopen(BASE + name + ".csv", timeout=60) as r:
        text = r.read().decode("utf-8")
    return name, list(csv.DictReader(io.StringIO(text)))


def clean(text):
    text = text.replace("­\n", "").replace("­", "")
    text = text.replace("-\n", "-").replace("\f", " ")
    return re.sub(r"\s+", " ", text).strip()


def strip_markup(text):
    """Convierte '[paralizar]{mechanic:paralysis}' en 'paralizar'."""
    def repl(m):
        label, target = m.group(1), m.group(2)
        return label or target.split(":")[-1].replace("-", " ")
    return re.sub(r"\[([^\]]*)\]\{([^}]*)\}", repl, text)


def latest_flavor(rows, key, skip=None):
    """Devuelve {(id, idioma): texto} con la versión de juego más reciente."""
    best = {}
    for r in rows:
        lang = r.get("language_id")
        if lang not in (ES, EN):
            continue
        text = clean(r["flavor_text"])
        if not text or (skip and skip.search(text)):
            continue
        k = (r[key], lang)
        vg = int(r["version_group_id"])
        if k not in best or vg > best[k][0]:
            best[k] = (vg, text)
    return {k: v[1] for k, v in best.items()}


def names(rows, key, field="name"):
    out = {}
    for r in rows:
        if r["local_language_id"] in (ES, EN) and r.get(field):
            out[(r[key], r["local_language_id"])] = r[field].strip()
    return out


def title(identifier):
    return " ".join(p.capitalize() for p in identifier.split("-"))


def main():
    print("Descargando datos de PokeAPI…")
    with ThreadPoolExecutor(8) as pool:
        data = dict(pool.map(fetch, FILES))
    print("Procesando…")

    types = {r["id"]: r["identifier"] for r in data["types"]}

    # ---------- Habilidades ----------
    ab_names = names(data["ability_names"], "ability_id")
    ab_flavor = latest_flavor(data["ability_flavor_text"], "ability_id")
    ab_prose = {r["ability_id"]: r for r in data["ability_prose"] if r["local_language_id"] == EN}
    abilities = []
    for r in data["abilities"]:
        if r["is_main_series"] != "1":
            continue
        i = r["id"]
        en = ab_names.get((i, EN), title(r["identifier"]))
        desc = ab_flavor.get((i, ES))
        lang = "es"
        if not desc:
            prose = ab_prose.get(i)
            desc = strip_markup(clean(prose["short_effect"])) if prose and prose["short_effect"] else ab_flavor.get((i, EN), "")
            lang = "en"
        abilities.append({
            "id": int(i), "n": ab_names.get((i, ES), en), "en": en,
            "d": desc, **({"l": "en"} if lang == "en" and desc else {}),
        })
    ability_ids = {a["id"] for a in abilities}

    # ---------- Movimientos ----------
    mv_names = names(data["move_names"], "move_id")
    mv_flavor = latest_flavor(data["move_flavor_text"], "move_id", REMOVED_MOVE_TEXT)
    mv_prose = {r["move_effect_id"]: r for r in data["move_effect_prose"] if r["local_language_id"] == EN}
    moves = []
    for r in data["moves"]:
        t = types.get(r["type_id"])
        if t in (None, "shadow", "unknown"):
            continue
        i = r["id"]
        en = mv_names.get((i, EN), title(r["identifier"]))
        desc = mv_flavor.get((i, ES))
        lang = "es"
        if not desc:
            prose = mv_prose.get(r["effect_id"])
            if prose and prose["short_effect"]:
                desc = strip_markup(clean(prose["short_effect"]))
                desc = desc.replace("$effect_chance", r["effect_chance"] or "?")
            else:
                desc = mv_flavor.get((i, EN), "")
            lang = "en"
        moves.append({
            "id": int(i), "n": mv_names.get((i, ES), en), "en": en, "t": t,
            "c": DAMAGE_CLASS.get(r["damage_class_id"], "status"),
            "p": int(r["power"]) if r["power"] else None,
            "a": int(r["accuracy"]) if r["accuracy"] else None,
            "pp": int(r["pp"]) if r["pp"] else None,
            "pr": int(r["priority"] or 0),
            "d": desc, **({"l": "en"} if lang == "en" and desc else {}),
        })

    # ---------- Pokémon ----------
    sp_names = names(data["pokemon_species_names"], "pokemon_species_id")
    form_names = names(data["pokemon_form_names"], "pokemon_form_id", "pokemon_name")
    default_form = {}
    for f in data["pokemon_forms"]:
        if f["is_default"] == "1":
            default_form[f["pokemon_id"]] = f["id"]

    p_types, p_stats, p_abs = {}, {}, {}
    for r in data["pokemon_types"]:
        p_types.setdefault(r["pokemon_id"], []).append((int(r["slot"]), types[r["type_id"]]))
    for r in data["pokemon_stats"]:
        p_stats.setdefault(r["pokemon_id"], {})[int(r["stat_id"])] = int(r["base_stat"])
    for r in data["pokemon_abilities"]:
        if int(r["ability_id"]) in ability_ids:
            p_abs.setdefault(r["pokemon_id"], []).append(
                (int(r["slot"]), int(r["ability_id"]), r["is_hidden"] == "1"))

    form_es = {r["pokemon_form_id"]: r["form_name"].strip() for r in data["pokemon_form_names"]
               if r["local_language_id"] == ES and r["form_name"]}
    rows_by_ident = {r["identifier"]: r for r in data["pokemon"]}
    region = {"alola": "Forma de Alola", "galar": "Forma de Galar",
              "hisui": "Forma de Hisui", "paldea": "Forma de Paldea"}
    breed = {"combat-breed": "Raza Combatiente", "blaze-breed": "Raza Ardiente",
             "aqua-breed": "Raza Acuática"}
    fold = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
    name_cache = {}

    def display_name(r):
        """Nombre en español; para las formas, 'Especie (Forma)' si no hay nombre completo."""
        i = r["id"]
        if i in name_cache:
            return name_cache[i]
        sp, ident = r["species_id"], r["identifier"]
        species = sp_names.get((sp, ES)) or sp_names.get((sp, EN)) or title(ident)
        name = None
        if r["is_default"] == "1":
            name = species
        else:
            fid = default_form.get(i)
            es_full, es_form = form_names.get((fid, ES)), form_es.get(fid)
            if es_full:
                name = es_full
            elif es_form:
                name = es_form if fold(species) in fold(es_form) else f"{species} ({es_form})"
            elif ident.endswith("-gmax") and ident[:-5] in rows_by_ident:
                base = display_name(rows_by_ident[ident[:-5]])
                name = base.replace(" (", " Gigamax (", 1) if " (" in base else base + " Gigamax"
            elif m := re.search(r"-mega(?:-([xyz]))?$", ident):
                name = f"Mega-{species}" + (f" {m.group(1).upper()}" if m.group(1) else "")
            elif m := re.search(r"-(alola|galar|hisui|paldea)(?:-(.+))?$", ident):
                extra = breed.get(m.group(2) or "")
                name = f"{species} ({region[m.group(1)]}" + (f", {extra}" if extra else "") + ")"
            else:
                name = form_names.get((fid, EN)) or title(ident)
        name_cache[i] = name
        return name

    # ¿Puede evolucionar todavía? (para el Mineral Evol)
    species_ident = {r["id"]: r["identifier"] for r in data["pokemon_species"]}
    has_evolution = {r["evolves_from_species_id"] for r in data["pokemon_species"] if r["evolves_from_species_id"]}
    battle_only = {f["pokemon_id"] for f in data["pokemon_forms"]
                   if f["is_default"] == "1" and (f["is_battle_only"] == "1" or f["is_mega"] == "1")}
    # Especies en las que solo evoluciona una forma concreta (la regional o una variante).
    only_form_evolves = {
        "farfetchd": "-galar", "corsola": "-galar", "mr-mime": "-galar", "linoone": "-galar",
        "yamask": "-galar", "qwilfish": "-hisui", "basculin": "-white-striped",
    }

    def can_evolve(r):
        i, sp, ident = r["id"], r["species_id"], r["identifier"]
        base = species_ident.get(sp, "")
        if sp not in has_evolution:
            return False
        if base in only_form_evolves:
            return only_form_evolves[base] in ident
        if r["is_default"] != "1":
            # Megas, gigamax, formas de combate, tótem y variantes especiales no evolucionan.
            if i in battle_only or re.search(r"-(mega|gmax|totem|starter|cap|cosplay|spiky-eared)", ident):
                return False
            if base == "pikachu":
                return False
        return True

    pokemon = []
    for r in data["pokemon"]:
        i, sp = r["id"], r["species_id"]
        stats = p_stats.get(i, {})
        if len(stats) < 6 or i not in p_types:
            continue
        name = display_name(r)
        pokemon.append({
            "id": int(i), "sp": int(sp), "n": name, "k": r["identifier"],
            "t": [t for _, t in sorted(p_types[i])],
            "s": [stats.get(s, 0) for s in range(1, 7)],
            "ab": [[a, 1 if h else 0] for _, a, h in sorted(p_abs.get(i, []))],
            **({"ev": 1} if can_evolve(r) else {}),
        })

    # ---------- Objetos ----------
    it_names = names(data["item_names"], "item_id")
    it_flavor = latest_flavor(data["item_flavor_text"], "item_id")
    it_prose = {r["item_id"]: strip_markup(clean(r["short_effect"])) for r in data["item_prose"]
                if r["local_language_id"] == EN and r["short_effect"]}
    megas = [(p["k"], p) for p in pokemon if "-mega" in p["k"]]
    species_es = {}
    for p in pokemon:
        species_es.setdefault(p["sp"], sp_names.get((str(p["sp"]), ES)) or p["n"])

    def mega_for(ident):
        """Empareja 'charizardite-x' con 'charizard-mega-x' por el prefijo común más largo."""
        suffix = re.search(r"-([xyz])$", ident)
        best, best_len = None, 0
        for k, p in megas:
            base, _, rest = k.partition("-mega")
            if (suffix.group(1) if suffix else "") != rest.lstrip("-"):
                continue
            n = 0
            while n < min(len(base), len(ident)) and base[n] == ident[n]:
                n += 1
            if n >= 4 and n > best_len:
                best, best_len = p, n
        return best

    def generated_effect(group, ident, en):
        t = TYPE_RE.search(en or "")
        tes = TYPE_ES[t.group(1)] if t else None
        if group == "berry" and tes and "super" in (en or "").lower():
            return f"Si recibe un movimiento supereficaz de tipo {tes}, reduce el daño a la mitad. Se consume."
        if group == "berry" and tes == "Normal":
            return "Reduce a la mitad el daño del primer movimiento de tipo Normal que reciba. Se consume."
        if group == "type" and tes:
            return f"Potencia un 20 % los movimientos de tipo {tes}."
        if group == "plate" and tes:
            return (f"Potencia un 20 % los movimientos de tipo {tes}. Si la lleva Arceus, "
                    f"pasa a ser de tipo {tes} y su movimiento Sentencia también.")
        if group == "gem" and tes:
            return f"Potencia un 30 % el primer movimiento de tipo {tes} que use. Se consume."
        if group == "memory" and tes:
            return (f"Si la lleva Silvally, pasa a ser de tipo {tes} "
                    f"y su movimiento Multiataque también.")
        if group == "mega":
            p = mega_for(ident)
            if p:
                return (f"Si la lleva {species_es[p['sp']]}, puede megaevolucionar a {p['n']} "
                        "durante el combate (una vez por combate).")
        return None

    items = []
    for r in data["items"]:
        group = ITEM_CATEGORIES.get(r["category_id"])
        i = r["id"]
        if not group or (i, ES) not in it_names or r["identifier"] in ("pass-orb",):
            continue
        items.append({
            "id": int(i), "n": it_names[(i, ES)], "en": it_names.get((i, EN), title(r["identifier"])),
            "k": r["identifier"], "g": group,
            "d": it_flavor.get((i, ES), ""),
            "e": generated_effect(group, r["identifier"], it_prose.get(i)),
        })
        if group == "mega" and (mp := mega_for(r["identifier"])):
            items[-1]["mp"] = mp["id"]  # pokémon mega al que corresponde la piedra

    # Traducciones propias para los textos que PokeAPI solo tiene en inglés (o vacíos).
    overrides_file = Path(__file__).resolve().parent / "es_overrides.json"
    if overrides_file.exists():
        overrides = json.loads(overrides_file.read_text(encoding="utf-8"))
        for it in items:
            text = overrides.get("items", {}).get(it["k"])
            if text:
                it["e"] = text
        for group, entries in (("moves", moves), ("abilities", abilities)):
            table = overrides.get(group, {})
            for it in entries:
                text = table.get(str(it["id"]))
                if text:
                    it["d"] = text
                    it.pop("l", None)

    for it in items:
        if not it["e"]:
            it.pop("e")
    missing = [it["k"] for it in items if "e" not in it and it["g"] in ("berry", "held", "species")]
    if missing:
        print(f"Aviso: {len(missing)} objetos sin efecto exacto en español:", ", ".join(missing))

    payload = {"pokemon": pokemon, "moves": moves, "abilities": abilities, "items": items}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    js = ("/* Generado por tools/build_data.py con datos de PokeAPI (pokeapi.co). No editar a mano. */\n"
          "window.POKEDATA = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n")
    OUT.write_text(js, encoding="utf-8")
    print(f"Listo: {len(pokemon)} pokémon, {len(moves)} movimientos, {len(abilities)} habilidades, "
          f"{len(items)} objetos "
          f"-> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print("Error generando los datos:", e, file=sys.stderr)
        sys.exit(1)
