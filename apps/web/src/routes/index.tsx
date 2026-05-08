import { Button } from "#/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-5xl font-bold">Benkyou o shimasu!!!</h1>
      <Button>Let's Go</Button>
    </div>
  );
}
