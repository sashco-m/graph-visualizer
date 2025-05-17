export interface PersonRow {
  nconst: string;
  primaryName: string;
  birthYear: string; // Can be "\\N"
  deathYear: string; // Can be "\\N"
}

export interface TitleRow {
  tconst: string;
  titleType: string;
  primaryTitle: string;
  originalTitle: string;
  isAdult: string;
  startYear: string;
  endYear: string;
  runtimeMinutes: string;
  genres: string;
}

export interface PrincipalRow {
  tconst: string;
  nconst: string;
  category: string;
  characters: string;
}
