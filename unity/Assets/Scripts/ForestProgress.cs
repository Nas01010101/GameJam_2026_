using UnityEngine;

public class ForestProgress : MonoBehaviour
{
    public SpriteRenderer forestRenderer;
    public Color[] stages;

    private int progress = 0;

    public void RestoreColor()
    {
        progress++;
        progress = Mathf.Clamp(progress, 0, stages.Length - 1);
        forestRenderer.color = stages[progress];
    }
}