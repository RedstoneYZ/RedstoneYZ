import NextLink from "next/link";
import type { LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";

const linkClass = "text-primary-600 dark:text-primary-500 hover:text-primary-400 dark:hover:text-primary-300";

const Link = ({ className, href, ...rest }: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isInternalLink = href && href.startsWith("/");
  const isAnchorLink = href && href.startsWith("#");

  className = linkClass + " " + className;

  if (isInternalLink) {
    return <NextLink className={className} href={href} {...rest} />;
  }

  if (isAnchorLink) {
    return <a className={className} href={href} {...rest} />;
  }

  return (
    <a className={className} target="_blank" rel="noopener noreferrer" href={href} {...rest} />
  );
};

export default Link;
