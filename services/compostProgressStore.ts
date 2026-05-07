import {
  compostProgressData,
  type CompostItem,
} from "@/services/compostProgress";

type Listener = () => void;

type UpdatePayload = {
  id: string;
  progressDelta?: number;
  status?: string;
  nextAction?: string;
  summary?: string;
  activity?: {
    title: string;
    time: string;
    description: string;
    isActive: boolean;
  };
};

let progressState: CompostItem[] = compostProgressData.map((item) => ({
  ...item,
  composition: [...item.composition],
  activities: [...item.activities],
}));

const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const setCompostProgress = (items: CompostItem[]) => {
  progressState = items;
  listeners.forEach((listener) => listener());
};

export const getCompostProgress = () => progressState;

export const getCompostItem = (id: string) =>
  progressState.find((item) => item.id === id);

export const updateCompostProgress = (payload: UpdatePayload) => {
  progressState = progressState.map((item) => {
    if (item.id !== payload.id) return item;

    const progressDelta = payload.progressDelta ?? 0;
    const nextProgress = Math.max(
      0,
      Math.min(100, item.progress + progressDelta),
    );
    const activities = payload.activity
      ? [payload.activity, ...item.activities]
      : item.activities;

    return {
      ...item,
      progress: nextProgress,
      status: payload.status ?? item.status,
      nextAction: payload.nextAction ?? item.nextAction,
      summary: payload.summary ?? item.summary,
      activities,
    };
  });

  notify();
};

export const subscribeCompostProgress = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
