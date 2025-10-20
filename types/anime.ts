type Anime = {
  mal_id: number;
  title: string;
  title_english?: string;
  images: {
    jpg: { image_url: string };
  };
  score?: number;
  rank?: number;
};

type Genre = {
  mal_id: number;
  name: string;
};
