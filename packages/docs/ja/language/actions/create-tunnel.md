# create_tunnel

<AvailabilityCard reach="partial" />

## 説明

2 つのエンティティのあいだにオブジェクトを配置し、そのオブジェクトに **円柱** 形状を与えます。半径は半径オペランドから取ります。その値が **0** の場合、エンジンは代わりに **5** を使います。

<DocsBlock type="info" title="両端点が同じオブジェクトの場合">

両端点が同じオブジェクトの場合、トンネルはその参照上に **そのまま** 置かれます — [create_object](/ja/language/actions/create-object) とは異なり衝突チェックはありません。生成されたオブジェクトは真上を向きます。

</DocsBlock>

<ActionParameters />

## 例

```megalo
action create_tunnel …
```

精選の例はまだありません — ビルド可用性は [Megalo バージョン](/ja/versions/) を参照。

## 対応バージョン

<ActionSupportedVersions />


関連 [アクション構文](/ja/language/elements/trigger/action)。
