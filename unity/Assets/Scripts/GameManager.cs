using System.Collections.Generic;
using UnityEngine;
using System;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    // Contains the words the player has collected so far (e.g., "joie", "triste")
    private HashSet<string> unlockedWords = new HashSet<string>();

    // Called when a new word is unlocked so gates can listen
    public event Action<string> OnWordUnlocked;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void UnlockWord(string word)
    {
        if (!unlockedWords.Contains(word))
        {
            unlockedWords.Add(word);
            Debug.Log($"[GameManager] Word unlocked: {word}");
            OnWordUnlocked?.Invoke(word);
        }
    }

    public bool HasWord(string word)
    {
        return unlockedWords.Contains(word);
    }
}
