import PageHeader from "../../components/ui/PageHeader";
import EventsList from "../../components/shared/EventsList";

export default function Events() {
  return (
    <div>
      <PageHeader title="Events" description="Upcoming school events - register to reserve your spot." />
      <EventsList />
    </div>
  );
}
