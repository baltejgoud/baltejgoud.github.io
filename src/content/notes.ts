/**
 * Notes people have sent, chosen by Baltej to show on the site. Only add notes with the writer's
 * permission, exactly as they wrote them. The strip stays hidden while this list is empty.
 */
export interface WallNote {
  name: string;
  role?: string;
  message: string;
  color: "yellow" | "blue" | "pink" | "green";
}

export const wallNotes: WallNote[] = [];
