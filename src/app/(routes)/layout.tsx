import Footer from "@/components/Footer";

export default ({ children }: Props) => (
  <><main id="root-layout" className="container p-2 mx-auto mb-12">
  {children}
</main>
  <Footer/>
  </>
);

type Props = {
  children: React.ReactNode;
};
