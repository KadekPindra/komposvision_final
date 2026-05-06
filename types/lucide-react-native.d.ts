declare module "lucide-react-native" {
  import type { ComponentType } from "react";
  import type { SvgProps } from "react-native-svg";

  export type LucideIcon = ComponentType<
    SvgProps & {
      color?: string;
      size?: number;
      strokeWidth?: number;
    }
  >;

  export const Home: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Camera: LucideIcon;
  export const BookOpen: LucideIcon;
  export const User: LucideIcon;
}
