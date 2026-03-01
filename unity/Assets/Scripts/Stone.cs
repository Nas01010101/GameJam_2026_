using UnityEngine;
//using UnityEngine.UI;
using System;
using TMPro;

public class Stone : MonoBehaviour
{
    public TMP_Text wordText;
    private EmotionData emotion;
    private Action<EmotionData> callback;

    public void Setup(EmotionData e,
        Action<EmotionData> cb)
    {
        emotion = e;
        callback = cb;
        wordText.text = e.emotionName;
    }

    public void OnClick()
    {
        callback.Invoke(emotion);
    }
}