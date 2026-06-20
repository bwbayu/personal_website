export interface Skill {
  id: string;
  name: string;
  iconClass?: string;
  iconImage?: string;
  categoryId: string;
  order: number;
  isShow: boolean;
}
