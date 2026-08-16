# サウンド

`play_sound` 用、および `hud_post_message` の任意サウンドオペランド用の記号的サウンドトークンです。値は @blamnetwork/blf の `e_megalo_sound` と一致します。

[`play_sound`](/ja/language/actions/play-sound) および [`hud_post_message`](/ja/language/actions/hud-post-message) で使います。

Megalo サウンドは `megalogameengine_sounds`（`mgls`）タグを参照します。他の Megalo アセットと異なり、[オブジェクトリスト](/ja/language/object-lists) システムではカスタマイズできません。代わりに、これらのサウンドは Megalo コンパイラにハードコードされています。カスタムマップはサウンドを差し替えられますが、名前の変更や新規サウンドの追加はできません。

<EnumVersionTable enum="sounds" />

## 注意

`hud_post_message` でメッセージに付随サウンドを鳴らしたくないときは、サウンドオペランドに `none` を使います。`play_sound` は対象の前に任意の `immediate` 接頭辞を受け付けます。
