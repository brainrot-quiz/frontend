/**
 * dom-to-image-more 라이브러리의 타입 정의
 */
declare module 'dom-to-image-more' {
  export interface DomToImageOptions {
    /** 품질 수준 (0 ~ 1) */
    quality?: number;
    /** 스케일 팩터 */
    scale?: number;
    /** 생성할 이미지의 너비 */
    width?: number;
    /** 생성할 이미지의 높이 */
    height?: number;
    /** 생성할 이미지의 스타일 */
    style?: Record<string, string>;
    /** 필터 함수 */
    filter?: (node: Element) => boolean;
    /** 배경색 (CSS 색상 문자열) */
    bgcolor?: string;
    /** 캔버스 너비 */
    canvasWidth?: number;
    /** 캔버스 높이 */
    canvasHeight?: number;
  }

  /**
   * DOM 요소를 PNG 데이터 URL로 변환
   */
  export function toPng(node: Element, options?: DomToImageOptions): Promise<string>;

  /**
   * DOM 요소를 JPEG 데이터 URL로 변환
   */
  export function toJpeg(node: Element, options?: DomToImageOptions): Promise<string>;

  /**
   * DOM 요소를 SVG 데이터 URL로 변환
   */
  export function toSvg(node: Element, options?: DomToImageOptions): Promise<string>;

  /**
   * DOM 요소를 Blob 객체로 변환
   */
  export function toBlob(node: Element, options?: DomToImageOptions): Promise<Blob>;

  /**
   * DOM 요소를 Canvas 객체로 변환
   */
  export function toCanvas(node: Element, options?: DomToImageOptions): Promise<HTMLCanvasElement>;

  /**
   * DOM 요소를 픽셀 데이터로 변환
   */
  export function toPixelData(node: Element, options?: DomToImageOptions): Promise<Uint8ClampedArray>;
} 