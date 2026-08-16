# base

<AvailabilityCard reach="yes" halo4="yes" h2a="yes">


</AvailabilityCard>

コンパイル済みの親 `.mglo` バリアントから継承します。派生スクリプトはその要素をベースのゲームタイプの上にマージします — バリアントファミリー（CTF から 1-Flag CTF など）に便利です。

`base` 行はファイルの **先頭行** でなければなりません — その前に何も置けません。

```megalo
base "ctf.mglo"
```

<DocsBlock type="note" title="Ubiquitous Language">

厳密には、MegaloEdit は `base` を要素としては扱いません。実際、`base` 宣言はシンタックスハイライトさえされません。ドキュメント内で見つけやすくするため、Elements セクションに含めています。

</DocsBlock>

詳しくは [ベースファイル](/ja/language/base-files) を参照。
