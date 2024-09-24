import styles from "./page.module.css";
import { Intro } from "./ui/intro";
import { Footer } from "./ui/footer";

export default function Home() {
  return (
    <div className={styles.page}>
      <Intro />
      <Footer />
    </div>
  );
}
