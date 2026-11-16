// Deutsche Bezeichnungen für AniList-Enums

const FORMATS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV (kurz)",
  MOVIE: "Film",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Musikvideo",
};

const STATUSES: Record<string, string> = {
  FINISHED: "Abgeschlossen",
  RELEASING: "Läuft aktuell",
  NOT_YET_RELEASED: "Noch nicht erschienen",
  CANCELLED: "Abgesetzt",
  HIATUS: "Pausiert",
};

const SEASONS: Record<string, string> = {
  WINTER: "Winter",
  SPRING: "Frühling",
  SUMMER: "Sommer",
  FALL: "Herbst",
};

const SOURCES: Record<string, string> = {
  ORIGINAL: "Original",
  MANGA: "Manga",
  LIGHT_NOVEL: "Light Novel",
  VISUAL_NOVEL: "Visual Novel",
  VIDEO_GAME: "Videospiel",
  NOVEL: "Roman",
  WEB_NOVEL: "Web-Novel",
  DOUJINSHI: "Dōjinshi",
  ANIME: "Anime",
  LIVE_ACTION: "Realverfilmung",
  GAME: "Spiel",
  COMIC: "Comic",
  MULTIMEDIA_PROJECT: "Multimedia-Projekt",
  PICTURE_BOOK: "Bilderbuch",
  OTHER: "Sonstiges",
};

const fallback = (v: string) => v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ");

export const formatLabel = (v: string) => FORMATS[v] ?? fallback(v);
export const statusLabel = (v: string) => STATUSES[v] ?? fallback(v);
export const seasonLabel = (v: string) => SEASONS[v] ?? fallback(v);
export const sourceLabel = (v: string) => SOURCES[v] ?? fallback(v);
