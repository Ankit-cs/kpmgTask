import { Loader } from "@/components/common/Loader";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <Loader text="Loading..." />
    </div>
  );
}
