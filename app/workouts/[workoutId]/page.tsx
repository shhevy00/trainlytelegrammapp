import type { ReactElement } from "react";
import { WorkoutDetailScreen } from "@/components/workouts/WorkoutDetailScreen";

interface WorkoutDetailPageProps {
  params: Promise<{ workoutId: string }>;
}

export default async function WorkoutDetailPage(props: WorkoutDetailPageProps): Promise<ReactElement> {
  const { workoutId } = await props.params;
  return <WorkoutDetailScreen workoutId={workoutId} />;
}
