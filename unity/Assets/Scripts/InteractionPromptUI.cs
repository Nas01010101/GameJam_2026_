using UnityEngine;
using UnityEngine.UI;

public class InteractionPromptUI : MonoBehaviour
{
    public CanvasGroup canvasGroup;
    public float fadeSpeed = 5f;

    private bool shouldShow = false;

    void Update()
    {
        float targetAlpha = shouldShow ? 1 : 0;
        canvasGroup.alpha = Mathf.Lerp(canvasGroup.alpha, targetAlpha, Time.deltaTime * fadeSpeed);
    }

    public void Show()
    {
        shouldShow = true;
    }

    public void Hide()
    {
        shouldShow = false;
    }
}