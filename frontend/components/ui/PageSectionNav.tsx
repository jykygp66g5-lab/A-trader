"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";


export type PageSection = {
  id: string;
  label: string;
};


type PageSectionNavProps = {
  sections: readonly PageSection[];
  className?: string;
};


const IDLE_DELAY = 1400;


export default function PageSectionNav({
  sections,
  className = "",
}: PageSectionNavProps) {
  const [
    activeSection,
    setActiveSection,
  ] = useState(
    sections[0]?.id ?? "",
  );

  const [
    mobileActive,
    setMobileActive,
  ] = useState(false);

  const idleTimer = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);


  // =====================================================
  // MOBILE ACTIVITY
  // =====================================================

  const showMobileNav = useCallback(() => {
    setMobileActive(true);

    if (idleTimer.current) {
      clearTimeout(
        idleTimer.current,
      );
    }

    idleTimer.current = setTimeout(
      () => {
        setMobileActive(false);
      },
      IDLE_DELAY,
    );
  }, []);


  useEffect(() => {
    const handleActivity = () => {
      showMobileNav();
    };

    window.addEventListener(
      "scroll",
      handleActivity,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "touchstart",
      handleActivity,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleActivity,
      );

      window.removeEventListener(
        "touchstart",
        handleActivity,
      );

      if (idleTimer.current) {
        clearTimeout(
          idleTimer.current,
        );
      }
    };
  }, [
    showMobileNav,
  ]);


  // =====================================================
  // ACTIVE SECTION
  // =====================================================

  useEffect(() => {
    if (!sections.length) {
      return;
    }

    const elements = sections
      .map(
        (section) =>
          document.getElementById(
            section.id,
          ),
      )
      .filter(
        (
          element,
        ): element is HTMLElement =>
          Boolean(element),
      );

    if (!elements.length) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter(
              (entry) =>
                entry.isIntersecting,
            )
            .sort(
              (a, b) =>
                b.intersectionRatio
                - a.intersectionRatio,
            );

          if (visible[0]) {
            setActiveSection(
              visible[0].target.id,
            );
          }
        },
        {
          rootMargin:
            "-18% 0px -62% 0px",

          threshold: [
            0,
            0.1,
            0.25,
            0.5,
          ],
        },
      );

    elements.forEach(
      (element) => {
        observer.observe(
          element,
        );
      },
    );

    return () => {
      observer.disconnect();
    };
  }, [
    sections,
  ]);


  // =====================================================
  // NAVIGATION
  // =====================================================

  const goToSection = (
    id: string,
  ) => {
    const element =
      document.getElementById(
        id,
      );

    if (!element) {
      return;
    }

    setActiveSection(id);

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    showMobileNav();
  };


  if (!sections.length) {
    return null;
  }


  return (
    <>
      {/* ===============================================
          DESKTOP SECTION BAR
      =============================================== */}

      <nav
        aria-label="Page sections"
        className={`
          fixed
          left-1/2
          top-5
          z-40
          hidden
          -translate-x-1/2
          lg:block
          ${className}
        `}
      >
        <div
          className="
            flex
            max-w-[min(80vw,900px)]
            items-center
            gap-1
            overflow-x-auto
            rounded-2xl
            border
            border-white/10
            bg-zinc-950/65
            p-1.5
            shadow-2xl
            shadow-black/25
            backdrop-blur-2xl
            backdrop-saturate-150
          "
        >
          {
            sections.map(
              (section) => {
                const active =
                  activeSection
                  === section.id;

                return (
                  <button
                    key={
                      section.id
                    }

                    type="button"

                    onClick={
                      () =>
                        goToSection(
                          section.id,
                        )
                    }

                    aria-current={
                      active
                        ? "location"
                        : undefined
                    }

                    className={`
                      shrink-0
                      rounded-xl
                      px-3.5
                      py-2
                      text-xs
                      font-medium
                      transition-all
                      duration-300

                      ${
                        active
                          ? `
                            bg-white/10
                            text-white
                            shadow-inner
                            shadow-white/5
                          `
                          : `
                            text-zinc-500
                            hover:bg-white/5
                            hover:text-zinc-200
                          `
                      }
                    `}
                  >
                    {
                      section.label
                    }
                  </button>
                );
              },
            )
          }
        </div>
      </nav>


      {/* ===============================================
          MOBILE RIGHT-SIDE NAVIGATOR
      =============================================== */}

      <nav
        aria-label="Page sections"
        className="
          fixed
          right-2
          top-1/2
          z-40
          -translate-y-1/2
          lg:hidden
        "
      >
        <div
          className={`
            flex
            flex-col
            items-end
            gap-1
            rounded-2xl
            border
            border-white/10
            bg-zinc-950/60
            p-1.5
            shadow-2xl
            shadow-black/30
            backdrop-blur-2xl
            backdrop-saturate-150
            transition-all
            duration-500
            ease-out

            ${
              mobileActive
                ? `
                  translate-x-0
                  opacity-100
                `
                : `
                  translate-x-[calc(100%-14px)]
                  opacity-45
                `
            }
          `}
          onPointerDown={
            showMobileNav
          }
        >
          {
            sections.map(
              (section) => {
                const active =
                  activeSection
                  === section.id;

                return (
                  <button
                    key={
                      section.id
                    }

                    type="button"

                    onClick={
                      () =>
                        goToSection(
                          section.id,
                        )
                    }

                    aria-label={
                      `Go to ${section.label}`
                    }

                    aria-current={
                      active
                        ? "location"
                        : undefined
                    }

                    className={`
                      group
                      flex
                      h-8
                      items-center
                      justify-end
                      rounded-xl
                      transition-all
                      duration-300

                      ${
                        mobileActive
                          ? "px-2.5"
                          : "w-5 px-1"
                      }

                      ${
                        active
                          ? `
                            bg-white/10
                            text-white
                          `
                          : `
                            text-zinc-500
                          `
                      }
                    `}
                  >
                    <span
                      className={`
                        mr-2
                        whitespace-nowrap
                        text-[11px]
                        font-medium
                        transition-all
                        duration-300

                        ${
                          mobileActive
                            ? `
                              max-w-32
                              opacity-100
                            `
                            : `
                              max-w-0
                              overflow-hidden
                              opacity-0
                            `
                        }
                      `}
                    >
                      {
                        section.label
                      }
                    </span>

                    <span
                      aria-hidden="true"
                      className={`
                        block
                        rounded-full
                        transition-all
                        duration-300

                        ${
                          active
                            ? `
                              h-4
                              w-1
                              bg-zinc-100
                            `
                            : `
                              h-1.5
                              w-1.5
                              bg-zinc-600
                            `
                        }
                      `}
                    />
                  </button>
                );
              },
            )
          }
        </div>
      </nav>
    </>
  );
}
