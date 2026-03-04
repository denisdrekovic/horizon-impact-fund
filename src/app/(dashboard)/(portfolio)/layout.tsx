import PortfolioTabBar from "@/components/layout/PortfolioTabBar";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PortfolioTabBar />
      {children}
    </>
  );
}
