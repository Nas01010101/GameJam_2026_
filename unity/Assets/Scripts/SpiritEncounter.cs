using UnityEngine;

public class SpiritEncounter : MonoBehaviour
{
    public EmotionDatabase database;
    public StoneManager stoneManager;
    public ForestProgress forest;

    private EmotionData currentEmotion;
    private int errorCount = 0;

    void Start()
    {
        LoadNextSpirit();
    }

    void LoadNextSpirit()
    {
        currentEmotion = database.GetNextEmotion();
        stoneManager.GenerateChoices(currentEmotion, OnChoiceSelected);
    }

    void OnChoiceSelected(EmotionData chosen)
    {
        AudioSource.PlayClipAtPoint(chosen.pronunciation, Vector3.zero);

        if (chosen == currentEmotion)
        {
            errorCount = 0;
            forest.RestoreColor();
            Invoke(nameof(LoadNextSpirit), 2f);
        }
        else
        {
            errorCount++;

            if (errorCount >= 3)
                FindObjectOfType<BreathingSystem>().StartBreathing();
        }
    }
}