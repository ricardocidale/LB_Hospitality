import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          url?: string;
          "agent-id"?: string;
          "server-location"?: string;
          language?: string;
        },
        HTMLElement
      >;
    }
  }
}
