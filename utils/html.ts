// from https://gist.github.com/f9e184b78bbfc4419bc1ee70c238ca6f

const symbol = Symbol("TgHtml.symbol");

type Escapable = bigint | boolean | Error | null | number | string | undefined;
type Sub = Escapable | TgHtml;

export const escapeHtml = (s: Escapable) =>
	String(s)
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")
		.replace(/</g, "&lt;");

const isTgHtml = (o: Sub): o is TgHtml => typeof o?.[symbol] === "string";
const toHtml = (o: Sub) => (isTgHtml(o) ? o[symbol] : escapeHtml(o));

export class TgHtml {
	readonly [Symbol.toStringTag] = "TgHtml";
	private readonly [symbol]: string;
	private constructor(s: string) {
		this[symbol] = s;
	}
	toJSON() {
		return this[symbol];
	}

	static tag(raw: TemplateStringsArray, ...subs: Sub[]) {
		return new TgHtml(String.raw({ raw } as any, ...subs.map(toHtml)));
	}
	static join(sep: Sub, s: Sub[]) {
		return new TgHtml(s.map(toHtml).join(toHtml(sep)));
	}
	static concat(...s: Sub[]) {
		return TgHtml.join("", s);
	}
	static pre(s: Sub) {
		return TgHtml.tag`<pre>${s}</pre>`;
	}
}

export const html = (raw: TemplateStringsArray, ...subs: Sub[]) =>
	TgHtml.tag(raw, ...subs);
