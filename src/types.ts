import type { Card } from 'ts-fsrs';
export type Problem={id:string;title:string;url:string;difficulty:string;minutes:number;week:number;order:number};
export type StoredCard=Omit<Card,'due'|'last_review'>&{due:string;last_review?:string};
export type Progress={due:string;card:StoredCard|null;imported:boolean;note:string;independent:boolean};
export type Attempt={id:string;problemId:string;day:string;rating:1|2|3|4;minutes:number;wasNew:boolean;previous:Progress|null};
export type Settings={startDate:string;weeks:number;hours:number;timezone:string;reviewMultiplier:number};
export type StudyState={version:1;revision:number;settings:Settings;progress:Record<string,Progress>;history:Attempt[]};
