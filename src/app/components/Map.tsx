"use client";

import { useLocationSession } from "@/hooks/useLocationSession";
import Spinner from "@/components/Spinner";
import StartShareScreen from "@/components/StartShareScreen";
import ActiveShareScreen from "@/components/ActiveShareScreen";

export default function Map() {
  const {
    shareId,
    position,
    guestPosition,
    isLoading,
    handleShareStart,
    handleShareStop,
  } = useLocationSession();

  if (isLoading) return <Spinner />;

  if (!shareId) {
    return <StartShareScreen handleShareStart={handleShareStart} />;
  }

  return (
    <ActiveShareScreen
      shareId={shareId}
      position={position}
      guestPosition={guestPosition}
      handleShareStop={handleShareStop}
    />
  );
}