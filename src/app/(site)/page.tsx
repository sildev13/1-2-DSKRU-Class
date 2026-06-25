export default function Home() {
  return (
    <>
      <div
        className="relative h-screen overflow-hidden px-4"
      >
        <img
          className="absolute top-0 left-0 w-full h-full object-cover bg-aura-animate"
          src="/bg-dark-blue-aura.png"
          alt="bg-dark-blue-aura"
        />
        <img
          className="absolute top-0 left-0 w-full h-full object-cover object-left bg-photo"
          src="/bg1.jpg"
          alt="Background"
        />

        <div className="relative h-full flex justify-center items-center">
          <div className="text-center">
            <h1 className="text-8xl text-white sm:text-6xl font-bold main-text-animate drop-shadow-md mb-8">
              Welcome To 1/2 Room Website
            </h1>
            <p className="text-2xl text-white font-thin description-text-animate">
              <span className="whitespace-nowrap">
              Website ของห้อง 1/2 สุดตึงเฟี้ยว 👽
              </span>{" "}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
