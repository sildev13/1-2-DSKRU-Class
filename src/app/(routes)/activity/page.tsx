import { Link } from "@nextui-org/link";
import { Image } from "@nextui-org/image";

const acti = [
  {
    title: {
      label: "พิธีไหว้ครู 2569",
      href: "http://dskru.kru.ac.th/",
    },
    from: "",
    to: "ทำพานไหว้ครู DSKRU",
    image: "activity/IMG_4467.JPG",
  },
];

export default function ActivityList() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {acti.map((item, index) => (
          <div className="shadow m-2 p-6 rounded-xl bg-white/5" key={index}>
            <Link
              isExternal
              showAnchorIcon
              // ลบ as={NextLink} ออกไปแล้ว
              href={item.title.href}
              className="font-bold"
              color="success"
            >
              {item.title.label}
            </Link>
            <p className="text-slate-500">
              {item.from}  {item.to}
            </p>
            <div className="flex justify-center mt-2">
              <Image
                alt="Activity"
                className="object-cover rounded-xl"
                src={item.image}
                width={512}
                height={256}
                isBlurred
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}