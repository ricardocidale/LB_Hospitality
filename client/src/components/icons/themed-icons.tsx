import { forwardRef, type SVGAttributes } from "react";
import { useIconSet } from "./IconSetContext";

import {
  AlertTriangle as LAlertTriangle,
  ArrowDown as LArrowDown,
  ArrowLeft as LArrowLeft,
  ArrowRight as LArrowRight,
  ArrowUp as LArrowUp,
  ArrowUpDown as LArrowUpDown,
  Bell as LBell,
  Building2 as LBuilding2,
  Calculator as LCalculator,
  Check as LCheck,
  CheckCircle as LCheckCircle,
  CheckCircle2 as LCheckCircle2,
  ChevronDown as LChevronDown,
  ChevronLeft as LChevronLeft,
  ChevronRight as LChevronRight,
  ChevronsUpDown as LChevronsUpDown,
  ChevronUp as LChevronUp,
  Circle as LCircle,
  Clock as LClock,
  Crop as LCrop,
  ExternalLink as LExternalLink,
  FlaskConical as LFlaskConical,
  GalleryVerticalEnd as LGalleryVerticalEnd,
  GitCompare as LGitCompare,
  GripVertical as LGripVertical,
  Image as LImage,
  ImagePlus as LImagePlus,
  Images as LImages,
  Info as LInfo,
  Loader2 as LLoader2,
  Lock as LLock,
  Mail as LMail,
  MessageSquare as LMessageSquare,
  Minus as LMinus,
  MoreHorizontal as LMoreHorizontal,
  MoreVertical as LMoreVertical,
  PanelLeft as LPanelLeft,
  Paperclip as LPaperclip,
  Pencil as LPencil,
  Phone as LPhone,
  PhoneOff as LPhoneOff,
  Plus as LPlus,
  Scale as LScale,
  Search as LSearch,
  Send as LSend,
  Server as LServer,
  Share2 as LShare2,
  Shield as LShield,
  Sparkles as LSparkles,
  Star as LStar,
  Trash2 as LTrash2,
  Trophy as LTrophy,
  RefreshCw as LRefreshCw,
  FileText as LFileText,
  Upload as LUpload,
  X as LX,
  XCircle as LXCircle,
  ZoomIn as LZoomIn,
  ZoomOut as LZoomOut,
  type LucideIcon,
} from "lucide-react";

import {
  Warning as PAlertTriangle,
  ArrowDown as PArrowDown,
  ArrowLeft as PArrowLeft,
  ArrowRight as PArrowRight,
  ArrowUp as PArrowUp,
  ArrowsDownUp as PArrowUpDown,
  Bell as PBell,
  Buildings as PBuilding2,
  Calculator as PCalculator,
  Check as PCheck,
  CheckCircle as PCheckCircle,
  CaretDown as PChevronDown,
  CaretLeft as PChevronLeft,
  CaretRight as PChevronRight,
  CaretUpDown as PChevronsUpDown,
  CaretUp as PChevronUp,
  Circle as PCircle,
  Clock as PClock,
  Crop as PCrop,
  ArrowSquareOut as PExternalLink,
  Flask as PFlaskConical,
  SquaresFour as PGalleryVerticalEnd,
  GitDiff as PGitCompare,
  DotsSixVertical as PGripVertical,
  Image as PImage,
  ImageSquare as PImagePlus,
  Images as PImages,
  Info as PInfo,
  CircleNotch as PLoader2,
  Lock as PLock,
  Envelope as PMail,
  ChatTeardropText as PMessageSquare,
  Minus as PMinus,
  DotsThree as PMoreHorizontal,
  DotsThreeVertical as PMoreVertical,
  SidebarSimple as PPanelLeft,
  Paperclip as PPaperclip,
  PencilSimple as PPencil,
  Phone as PPhone,
  PhoneSlash as PPhoneOff,
  Plus as PPlus,
  Scales as PScale,
  MagnifyingGlass as PSearch,
  PaperPlaneTilt as PSend,
  HardDrives as PServer,
  ShareNetwork as PShare2,
  Shield as PShield,
  Sparkle as PSparkles,
  Star as PStar,
  Trash as PTrash2,
  Trophy as PTrophy,
  ArrowsClockwise as PRefreshCw,
  FileText as PFileText,
  Upload as PUpload,
  X as PX,
  XCircle as PXCircle,
  MagnifyingGlassPlus as PZoomIn,
  MagnifyingGlassMinus as PZoomOut,
} from "@phosphor-icons/react";

type IconProps = SVGAttributes<SVGSVGElement> & { size?: number | string };

type LucideComp = LucideIcon;
type PhosphorComp = React.ComponentType<any>;

function themed(LIcon: LucideComp, PIcon: PhosphorComp, displayName: string) {
  const C = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
    const iconSet = useIconSet();
    if (iconSet === "phosphor") {
      return <PIcon ref={ref} {...props} />;
    }
    return <LIcon ref={ref} {...props} />;
  });
  C.displayName = displayName;
  return C;
}

export const AlertTriangle = themed(LAlertTriangle, PAlertTriangle, "AlertTriangle");
export const ArrowDown = themed(LArrowDown, PArrowDown, "ArrowDown");
export const ArrowLeft = themed(LArrowLeft, PArrowLeft, "ArrowLeft");
export const ArrowRight = themed(LArrowRight, PArrowRight, "ArrowRight");
export const ArrowUp = themed(LArrowUp, PArrowUp, "ArrowUp");
export const ArrowUpDown = themed(LArrowUpDown, PArrowUpDown, "ArrowUpDown");
export const Bell = themed(LBell, PBell, "Bell");
export const Building2 = themed(LBuilding2, PBuilding2, "Building2");
export const Calculator = themed(LCalculator, PCalculator, "Calculator");
export const Check = themed(LCheck, PCheck, "Check");
export const CheckCircle = themed(LCheckCircle, PCheckCircle, "CheckCircle");
export const CheckCircle2 = themed(LCheckCircle2, PCheckCircle, "CheckCircle2");
export const ChevronDown = themed(LChevronDown, PChevronDown, "ChevronDown");
export const ChevronLeft = themed(LChevronLeft, PChevronLeft, "ChevronLeft");
export const ChevronRight = themed(LChevronRight, PChevronRight, "ChevronRight");
export const ChevronsUpDown = themed(LChevronsUpDown, PChevronsUpDown, "ChevronsUpDown");
export const ChevronUp = themed(LChevronUp, PChevronUp, "ChevronUp");
export const Circle = themed(LCircle, PCircle, "Circle");
export const Clock = themed(LClock, PClock, "Clock");
export const Crop = themed(LCrop, PCrop, "Crop");
export const ExternalLink = themed(LExternalLink, PExternalLink, "ExternalLink");
export const FlaskConical = themed(LFlaskConical, PFlaskConical, "FlaskConical");
export const GalleryVerticalEnd = themed(LGalleryVerticalEnd, PGalleryVerticalEnd, "GalleryVerticalEnd");
export const GitCompare = themed(LGitCompare, PGitCompare, "GitCompare");
export const GripVertical = themed(LGripVertical, PGripVertical, "GripVertical");
export const ImageIcon = themed(LImage, PImage, "ImageIcon");
export const ImagePlus = themed(LImagePlus, PImagePlus, "ImagePlus");
export const Images = themed(LImages, PImages, "Images");
export const Info = themed(LInfo, PInfo, "Info");
export const Loader2 = themed(LLoader2, PLoader2, "Loader2");
export const Lock = themed(LLock, PLock, "Lock");
export const Mail = themed(LMail, PMail, "Mail");
export const MessageSquare = themed(LMessageSquare, PMessageSquare, "MessageSquare");
export const Minus = themed(LMinus, PMinus, "Minus");
export const MoreHorizontal = themed(LMoreHorizontal, PMoreHorizontal, "MoreHorizontal");
export const PanelLeft = themed(LPanelLeft, PPanelLeft, "PanelLeft");
export const Paperclip = themed(LPaperclip, PPaperclip, "Paperclip");
export const Pencil = themed(LPencil, PPencil, "Pencil");
export const Phone = themed(LPhone, PPhone, "Phone");
export const PhoneOff = themed(LPhoneOff, PPhoneOff, "PhoneOff");
export const Plus = themed(LPlus, PPlus, "Plus");
export const Scale = themed(LScale, PScale, "Scale");
export const Search = themed(LSearch, PSearch, "Search");
export const Send = themed(LSend, PSend, "Send");
export const Server = themed(LServer, PServer, "Server");
export const Share2 = themed(LShare2, PShare2, "Share2");
export const Shield = themed(LShield, PShield, "Shield");
export const Sparkles = themed(LSparkles, PSparkles, "Sparkles");
export const Star = themed(LStar, PStar, "Star");
export const Trash2 = themed(LTrash2, PTrash2, "Trash2");
export const Trophy = themed(LTrophy, PTrophy, "Trophy");
export const RefreshCw = themed(LRefreshCw, PRefreshCw, "RefreshCw");
export const FileText = themed(LFileText, PFileText, "FileText");
export const Upload = themed(LUpload, PUpload, "Upload");
export const X = themed(LX, PX, "X");
export const XCircle = themed(LXCircle, PXCircle, "XCircle");
export const ZoomIn = themed(LZoomIn, PZoomIn, "ZoomIn");
export const ZoomOut = themed(LZoomOut, PZoomOut, "ZoomOut");

export const ArrowDownIcon = ArrowDown;
export const ArrowUpIcon = ArrowUp;
export const CheckIcon = Check;
export const ChevronDownIcon = ChevronDown;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;
export const ChevronsLeftIcon = ChevronLeft;
export const ChevronsRightIcon = ChevronRight;
export const GripVerticalIcon = GripVertical;
export const Loader2Icon = Loader2;
export const LoaderIcon = Loader2;
export const MoreHorizontalIcon = MoreHorizontal;
export const MoreVerticalIcon = themed(
  LMoreVertical, PMoreVertical, "MoreVerticalIcon"
);
export const PhoneIcon = Phone;
export const XIcon = X;

export type { LucideIcon };
