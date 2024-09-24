import Image from "next/image";
import styles from "../page.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <a
        href="https://github.com/alexohneander/sim_free/issues/new"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          aria-hidden
          src="https://nextjs.org/icons/file.svg"
          alt="File icon"
          width={16}
          height={16}
        />
        Issues
      </a>
      <a
        href="https://github.com/alexohneander/sim_free/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          aria-hidden
          src="https://nextjs.org/icons/window.svg"
          alt="Window icon"
          width={16}
          height={16}
        />
        Project
      </a>
      <a
        href="https://alexohneander.de"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          aria-hidden
          src="https://nextjs.org/icons/globe.svg"
          alt="Globe icon"
          width={16}
          height={16}
        />
        Go to alexohneander.de →
      </a>
    </footer>
  );
}
